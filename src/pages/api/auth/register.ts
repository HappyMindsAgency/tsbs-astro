// src/pages/api/auth/register.ts

import type { APIRoute } from 'astro';
import {
    RegistrationError,
    RegistrationServiceError,
    isValidEmail,
    isValidUsername,
    isStrongPassword,
    setAuthCookie,
} from '../../../utils/auth.utils';
import { AuthService } from '../../../services/auth.service';
import { isNicknameBlacklisted } from '../../../data/nicknameBlacklist';
import { containsBadWord } from '../../../data/badWords';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';
import { sendNotification } from '../../../lib/mailer';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

// Indirizzo email della Redazione — configurabile via .env
const EMAIL_REDAZIONE = import.meta.env.EMAIL_REDAZIONE ?? 'assistenzaweb@happyminds.it';

export const POST: APIRoute = async ({ request, cookies }) => {
    logger.info('[RegisterAPI] POST request received');

    let body: Record<string, unknown>;

    try {
        body = await request.json();
    } catch {
        logger.warn('[RegisterAPI] Invalid JSON in request body');
        return errorResponse(RegistrationError.MISSING_FIELDS, 400);
    }

    // Nomi dei campi coerenti con il form (username, name, surname).
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email    = typeof body.email    === 'string' ? body.email.trim()    : '';
    const password = typeof body.password === 'string' ? body.password        : '';
    const name     = typeof body.name     === 'string' ? body.name.trim()     : '';
    const surname  = typeof body.surname  === 'string' ? body.surname.trim()  : '';
    const consensoPrivacy = body.consensoPrivacy === true;
    const consensoNewsletter = body.consensoNewsletter === true;

    // --- Validazione server-side ---

    if (!username || !email || !password) {
        logger.warn('[RegisterAPI] Missing required fields');
        return errorResponse(RegistrationError.MISSING_FIELDS, 400);
    }

    if (!isValidEmail(email)) {
        logger.warn('[RegisterAPI] Invalid email format');
        return errorResponse(RegistrationError.INVALID_EMAIL, 400);
    }

    if (!isValidUsername(username)) {
        logger.warn('[RegisterAPI] Invalid username/nickname format');
        return errorResponse(RegistrationError.INVALID_NICKNAME, 400);
    }

    if (isNicknameBlacklisted(username) || containsBadWord(username)) {
        logger.warn('[RegisterAPI] Blacklisted/offensive username attempt');
        return errorResponse(RegistrationError.NICKNAME_BLACKLISTED, 400);
    }

    if (!isStrongPassword(password)) {
        logger.warn('[RegisterAPI] Weak password');
        return errorResponse(RegistrationError.WEAK_PASSWORD, 400);
    }

    const authService = new AuthService(STRAPI_API_BASE_URL, STRAPI_API);

    // --- Controllo email già registrata ---
    // Se l'email esiste già restituiamo un messaggio generico che invita al
    // recupero password, senza confermare in modo esplicito l'esistenza
    // dell'account (per non esporre quali email sono registrate).
    try {
        const existingUser = await authService.getUserByEmail(email);
        if (existingUser) {
            logger.warn('[RegisterAPI] Registration attempt with already-registered email');
            return errorResponse(RegistrationError.EMAIL_ALREADY_REGISTERED, 409);
        }
    } catch (error) {
        logger.error('[RegisterAPI] Email lookup failed during registration:', error);
        return errorResponse(RegistrationError.INTERNAL_SERVER_ERROR, 500);
    }

    // --- Step 1: crea lo User su Strapi (/auth/local/register) ---

    let userId: number;
    let jwt: string;

    try {
        // username del form → User.username in Strapi (usato per il login).
        const result = await authService.registerUser(username, email, password);
        jwt    = result.jwt;
        userId = result.user.id;
    } catch (error) {
        if (error instanceof RegistrationServiceError) {
            logger.warn(`[RegisterAPI] User registration failed: ${error.code}`);
            const status = error.code === RegistrationError.ALREADY_TAKEN ? 409 : 500;
            return errorResponse(error.code, status);
        }
        logger.error('[RegisterAPI] Unexpected error during User creation:', error);
        return errorResponse(RegistrationError.INTERNAL_SERVER_ERROR, 500);
    }

    // --- Step 2: crea il Membro collegato allo User ---
    // Mapping form → Membro: username → nickname, name → nome, surname → cognome.

    const membroCreated = await authService.createMembro(userId, username, email, name, surname);

    if (!membroCreated) {
        // TODO: lo User è stato creato ma il Membro no (stato orfano).
        //   Valutare se eliminare lo User automaticamente o gestire lato admin.
        logger.error(`[RegisterAPI] Membro creation failed for userId ${userId}. User exists but has no Membro.`);
        return errorResponse(RegistrationError.INTERNAL_SERVER_ERROR, 500);
    }

    // --- Step 3: invia le due email di registrazione (errore non bloccante) ---
    // La registrazione è già andata a buon fine: eventuali errori di invio
    // non devono impedire l'accesso dell'utente.
    await sendRegistrationEmails({
        username,
        email,
        name,
        surname,
        consensoPrivacy,
        consensoNewsletter,
    });

    // --- Successo: imposta il cookie JWT e risponde ---

    setAuthCookie(cookies, jwt);
    cookies.set('tsbs_welcome_pending', '1', {
        httpOnly: true,
        secure: import.meta.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });
    logger.info(`[RegisterAPI] Registration complete for userId ${userId}`);
    return successResponse();
};

/**
 * Invia, in modo non bloccante, le due comunicazioni di fine registrazione:
 *  1. notifica alla Redazione con il riepilogo dei dati del nuovo membro;
 *  2. email di benvenuto/ringraziamento al membro appena registrato.
 */
async function sendRegistrationEmails(
    membro: {
        username: string;
        email: string;
        name: string;
        surname: string;
        consensoPrivacy: boolean;
        consensoNewsletter: boolean;
    },
): Promise<void> {
    const { username, email, name, surname, consensoPrivacy, consensoNewsletter } = membro;

    const now = new Date();
    const dataIscrizione = new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'long',
        timeZone: 'Europe/Rome',
    }).format(now);
    const oraIscrizione = new Intl.DateTimeFormat('it-IT', {
        timeStyle: 'short',
        timeZone: 'Europe/Rome',
    }).format(now);

    // --- 1) Notifica alla Redazione ---
    try {
        await sendNotification({
            to: EMAIL_REDAZIONE,
            subject: 'Nuova iscrizione a The Secret Bookish Society | TSBS',
            html: `
                <h2 style="margin:0 0 1rem;font-size:1.25rem;">È stata registrata una nuova iscrizione a <em>The Secret Bookish Society</em></h2>
                <p>Ecco il riepilogo dei dati:</p>
                <table role="presentation" cellpadding="0" cellspacing="0"
                       style="width:100%;border-collapse:collapse;margin:1.25rem 0;">
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;width:40%;">Nome</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(name || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Cognome</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(surname || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Email</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(email)}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Data iscrizione</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(dataIscrizione)}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Ora iscrizione</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(oraIscrizione)}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Privacy</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${consensoPrivacy ? 'Sì' : 'No'}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Newsletter</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${consensoNewsletter ? 'Sì' : 'No'}</td>
                  </tr>
                </table>
            `,
        });
        logger.info(`[RegisterAPI] Notifica Redazione inviata a ${EMAIL_REDAZIONE}`);
    } catch (mailErr) {
        logger.error('[RegisterAPI] Invio email Redazione fallito (registrazione completata)', mailErr);
    }

    // --- 2) Email di ringraziamento al nuovo membro ---
    try {
        await sendNotification({
            to: email,
            subject: 'La tua iscrizione a TSBS è completata | TSBS',
            html: `
                <p>Ciao ${escapeHtml(username)},</p>
                <p><em>The Secret Bookish Society</em> ha ricevuto la tua iscrizione.</p>
                <p>
                    Grazie per aver risposto alla Chiamata.<br>
                    Da questo momento, il tuo nome è registrato negli archivi della Società.
                </p>
                <p>
                    Hai varcato la soglia, ma l’ingresso non è ancora completo.<br>
                    Per proseguire, affronta lo Smistamento e scopri quale Accademia ti attende.
                </p>
                <p><strong>Completa il tuo ingresso nella Società!</strong></p>
                <p><em>The Secret Bookish Society</em></p>
            `,
        });
        logger.info(`[RegisterAPI] Email di benvenuto inviata a ${email}`);
    } catch (mailErr) {
        logger.error('[RegisterAPI] Invio email di benvenuto fallito (registrazione completata)', mailErr);
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function successResponse(): Response {
    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

function errorResponse(error: string, status: number): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
