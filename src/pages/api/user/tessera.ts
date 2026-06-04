// src/pages/api/user/tessera.ts
// Salva il numero tessera del membro, imposta statoTessera: in_verifica
// e invia una notifica email alla Redazione.

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';
import { sendNotification } from '../../../lib/mailer';

// -----------------------------------------------------------------------
// Indirizzo email della Redazione — modifica qui (o sposta in .env)
// -----------------------------------------------------------------------
const EMAIL_REDAZIONE = import.meta.env.EMAIL_REDAZIONE ?? 'assistenzaweb@happyminds.it';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

const LIBRARY_CARD_CODE_PATTERN = /^\d{14}$/;

export const PUT: APIRoute = async ({ request, cookies }) => {
    const jwt = cookies.get('jwt')?.value;

    if (!jwt) {
        return json({ error: 'unauthorized' }, 401);
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'invalid_body' }, 400);
    }

    const tessera = typeof body.tessera === 'string'
        ? body.tessera.replace(/[\s-]+/g, '').trim()
        : '';

    if (!LIBRARY_CARD_CODE_PATTERN.test(tessera)) {
        return json({ error: 'invalid_tessera', message: 'Il numero tessera deve essere composto da 14 cifre.' }, 400);
    }

    const authHeader = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };

    // Step 1: recupera utente corrente
    const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: authHeader });
    if (!userRes.ok) {
        logger.error('[Tessera] /users/me fallito');
        return json({ error: 'unauthorized' }, 401);
    }
    const user = await userRes.json();

    // Step 2: trova il Membro collegato
    const qs = new URLSearchParams({
        'filters[user][id][$eq]': String(user.id),
        'fields[0]': 'tessera',
        'fields[1]': 'statoTessera',
        'fields[2]': 'datiAggiuntivi',
    });
    const membroRes = await fetch(
        `${STRAPI_API_BASE_URL}/membri?${qs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );

    if (!membroRes.ok) {
        const errText = await membroRes.text();
        logger.error(`[Tessera] GET membri fallito ${membroRes.status}: ${errText}`);
        return json({ error: 'membro_not_found' }, 404);
    }

    const membroData = await membroRes.json();
    const membro = membroData?.data?.[0];

    if (!membro) {
        logger.warn('[Tessera] Nessun Membro trovato per l\'utente corrente');
        return json({ error: 'membro_not_found' }, 404);
    }

    const membroId: string = membro.documentId;

    // Blocca il reinvio se già in verifica
    if ((membro?.statoTessera as string) === 'in_verifica') {
        return json({ error: 'already_in_verifica', message: 'La tessera è già in attesa di verifica.' }, 409);
    }

    // Step 3: salva tessera + imposta statoTessera: in_verifica in un'unica PUT atomica
    // statoTessera è un campo di primo livello (enumeration) — datiAggiuntivi rimane invariato
    const updateRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membroId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: {
                tessera,
                statoTessera: 'in_verifica',
            },
        }),
    });

    if (!updateRes.ok) {
        const err = await updateRes.text();
        logger.error(`[Tessera] Aggiornamento Membro fallito per ${membroId}: ${err}`);
        return json({ error: 'update_failed', message: 'Salvataggio non riuscito. Riprova.' }, 500);
    }

    logger.info(`[Tessera] Tessera ${tessera} salvata e stato impostato a in_verifica per membro ${membroId}`);

    // Step 4: invia notifica email alla Redazione (errore non bloccante)
    const dataOra = new Intl.DateTimeFormat('it-IT', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/Rome',
    }).format(new Date());

    try {
        await sendNotification({
            to: EMAIL_REDAZIONE,
            subject: 'Nuova tessera in attesa di verifica — TSBS',
            html: `
                <h2 style="margin:0 0 1rem;font-size:1.25rem;">Nuova tessera da verificare</h2>
                <p>Un membro ha inserito il proprio numero di tessera della Biblioteca Classense e attende verifica.</p>
                <table role="presentation" cellpadding="0" cellspacing="0"
                       style="width:100%;border-collapse:collapse;margin:1.25rem 0;">
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;width:40%;">Username</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(user.username ?? '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Email</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(user.email ?? '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Numero tessera</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-family:monospace;font-size:1.05em;">${escapeHtml(tessera)}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Data e ora invio</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(dataOra)}</td>
                  </tr>
                  <tr>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">ID Membro Strapi</td>
                    <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-family:monospace;">${escapeHtml(membroId)}</td>
                  </tr>
                </table>
                <p style="color:#555;">
                  Accedi al pannello Strapi per verificare la tessera e, se corretta, assegnare il trofeo relativo e impostare lo stato a <strong>verificata</strong>.<br>
                  In caso di tessera non valida, reimposta lo stato a <strong>nessuna</strong>.
                </p>
            `,
        });
        logger.info(`[Tessera] Notifica Redazione inviata a ${EMAIL_REDAZIONE}`);
    } catch (mailErr) {
        // L'email è non bloccante: il dato è già salvato correttamente
        logger.error('[Tessera] Invio email Redazione fallito (dato salvato correttamente)', mailErr);
    }

    return json({ success: true, statoTessera: 'in_verifica' });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
