// src/services/password-reset.service.ts
import crypto from 'node:crypto';
import { AuthService } from './auth.service';
import { sendNotification } from '../lib/mailer';
import { logger } from './logger';

interface PasswordResetConfig {
    tokenExpiryMinutes: number;
}

interface PasswordResetResult {
    success: boolean;
    message: string;
}

interface ConfirmResult {
    success: boolean;
    message: string;
    status: number;
}

// Indirizzo email della Redazione — configurabile via .env (stesso usato dal flusso tessera)
const EMAIL_REDAZIONE = import.meta.env.EMAIL_REDAZIONE ?? 'assistenzaweb@happyminds.it';

export class PasswordResetService {
    private config: PasswordResetConfig;
    private authService: AuthService;

    constructor(authService: AuthService, config: PasswordResetConfig) {
        this.authService = authService;
        this.config = config;
    }

    /**
     * Avvia il recupero password: genera un token a scadenza, lo salva sull'utente
     * e invia via mailer interno un link al form di reset (frontend, mai Strapi).
     * Restituisce sempre un messaggio generico per evitare l'enumerazione delle email.
     *
     * @param resetLinkBase URL assoluto del form frontend, es. https://app/auth/reset-password/conferma
     */
    async requestPasswordReset(email: string, resetLinkBase: string): Promise<PasswordResetResult> {
        logger.info(`[PasswordResetService] Richiesta reset per: ${email}`);

        if (!this.isValidEmail(email)) {
            logger.warn(`[PasswordResetService] Formato email non valido: ${email}`);
            return this.genericResponse();
        }

        const user = await this.authService.getUserByEmail(email);
        if (!user) {
            logger.info(`[PasswordResetService] Nessun utente per: ${email}`);
            return this.genericResponse();
        }

        const token = this.generateToken();
        const expiryDate = this.calculateExpiry();

        const updateSuccess = await this.authService.updateUserResetToken(user.id, token, expiryDate);
        if (!updateSuccess) {
            logger.error(`[PasswordResetService] Salvataggio token fallito per utente ${user.id}`);
            return this.genericResponse();
        }

        const resetLink = `${resetLinkBase}?token=${token}`;
        try {
            await sendNotification({
                to: email,
                subject: 'Reimposta la tua password — TSBS',
                html: this.buildResetRequestHtml(resetLink),
            });
            logger.info(`[PasswordResetService] Email di reset inviata a ${email}`);
        } catch (mailErr) {
            // Non bloccante: il token è già salvato
            logger.error('[PasswordResetService] Invio email di reset fallito', mailErr);
        }

        return this.genericResponse();
    }

    /**
     * Conferma il reset: valida token e scadenza, imposta la nuova password e
     * invia due notifiche (conferma all'utente + avviso alla Redazione).
     */
    async confirmPasswordReset(token: string, password: string, passwordConfirmation: string): Promise<ConfirmResult> {
        if (!token) {
            return { success: false, message: 'Link di reset non valido o mancante.', status: 400 };
        }
        if (!password || !passwordConfirmation) {
            return { success: false, message: 'Compila entrambi i campi password.', status: 400 };
        }
        if (password !== passwordConfirmation) {
            return { success: false, message: 'Le due password non coincidono.', status: 400 };
        }
        if (password.length < 8) {
            return { success: false, message: 'La nuova password deve contenere almeno 8 caratteri.', status: 400 };
        }

        const user = await this.authService.getUserByResetToken(token);
        if (!user) {
            logger.info('[PasswordResetService] Token di reset non trovato');
            return { success: false, message: 'Link di reset non valido. Richiedine uno nuovo.', status: 400 };
        }

        // Verifica scadenza
        const expiry = user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null;
        if (!expiry || Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
            logger.info(`[PasswordResetService] Token scaduto per utente ${user.id}`);
            return { success: false, message: 'Il link di reset è scaduto. Richiedine uno nuovo.', status: 400 };
        }

        const resetOk = await this.authService.resetUserPassword(user.id, password);
        if (!resetOk) {
            logger.error(`[PasswordResetService] Reset password fallito per utente ${user.id}`);
            return { success: false, message: 'Errore durante l\'aggiornamento della password. Riprova.', status: 500 };
        }

        // Notifiche email (non bloccanti: la password è già stata cambiata)
        await this.sendPasswordChangedEmails(user.username ?? '—', user.email);

        logger.info(`[PasswordResetService] Password reimpostata e notifiche inviate per utente ${user.id}`);
        return { success: true, message: 'Password aggiornata con successo. Ora puoi accedere con la nuova password.', status: 200 };
    }

    private async sendPasswordChangedEmails(username: string, email: string): Promise<void> {
        const dataOra = new Intl.DateTimeFormat('it-IT', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Europe/Rome',
        }).format(new Date());

        // 1) Conferma all'utente
        try {
            await sendNotification({
                to: email,
                subject: 'La tua password è stata modificata — TSBS',
                html: this.buildUserConfirmHtml(dataOra),
            });
            logger.info(`[PasswordResetService] Email di conferma inviata a ${email}`);
        } catch (err) {
            logger.error('[PasswordResetService] Invio conferma utente fallito', err);
        }

        // 2) Avviso alla Redazione
        try {
            await sendNotification({
                to: EMAIL_REDAZIONE,
                subject: 'Password modificata da un utente — TSBS',
                html: this.buildStaffNotifyHtml(username, email, dataOra),
            });
            logger.info(`[PasswordResetService] Notifica Redazione inviata a ${EMAIL_REDAZIONE}`);
        } catch (err) {
            logger.error('[PasswordResetService] Invio notifica Redazione fallito', err);
        }
    }

    private buildResetRequestHtml(resetLink: string): string {
        return `
            <h2 style="margin:0 0 1rem;font-size:1.25rem;">Reimposta la tua password</h2>
            <p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account.</p>
            <p>Clicca il pulsante qui sotto per scegliere una nuova password:</p>
            <p style="margin:1.5rem 0;">
              <a href="${resetLink}"
                 style="display:inline-block;padding:0.75rem 1.5rem;background:#1a1a2e;color:#ffffff;
                        text-decoration:none;border-radius:6px;font-weight:bold;">
                Reimposta password
              </a>
            </p>
            <p style="color:#555;font-size:0.9em;">
              Se il pulsante non funziona, copia e incolla questo indirizzo nel browser:<br>
              <a href="${resetLink}" style="color:#666;">${resetLink}</a>
            </p>
            <p style="color:#555;">Il link scade tra ${this.config.tokenExpiryMinutes} minuti.</p>
            <p style="color:#555;">Se non hai richiesto tu il reset, ignora questa email: la tua password resterà invariata.</p>
        `;
    }

    private buildUserConfirmHtml(dataOra: string): string {
        return `
            <h2 style="margin:0 0 1rem;font-size:1.25rem;">Password modificata</h2>
            <p>Ti confermiamo che la password del tuo account è stata modificata correttamente.</p>
            <p style="color:#555;">Data e ora: ${escapeHtml(dataOra)}</p>
            <p style="color:#555;">
              Se non sei stato tu a effettuare questa modifica, contatta subito l'assistenza
              all'indirizzo <a href="mailto:info@thesecretbookishsociety.it" style="color:#666;">info@thesecretbookishsociety.it</a>.
            </p>
        `;
    }

    private buildStaffNotifyHtml(username: string, email: string, dataOra: string): string {
        return `
            <h2 style="margin:0 0 1rem;font-size:1.25rem;">Cambio password utente</h2>
            <p>Un utente ha completato la procedura di recupero password.</p>
            <table role="presentation" cellpadding="0" cellspacing="0"
                   style="width:100%;border-collapse:collapse;margin:1.25rem 0;">
              <tr>
                <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;width:40%;">Nome utente</td>
                <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(username)}</td>
              </tr>
              <tr>
                <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Email</td>
                <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(email)}</td>
              </tr>
              <tr>
                <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Data e ora</td>
                <td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(dataOra)}</td>
              </tr>
            </table>
            <p style="color:#555;">Notifica automatica: nessuna azione richiesta salvo segnalazioni dell'utente.</p>
        `;
    }

    private generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private calculateExpiry(): Date {
        return new Date(Date.now() + this.config.tokenExpiryMinutes * 60 * 1000);
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private genericResponse(): PasswordResetResult {
        return {
            success: true,
            message: 'Se un account con questa email esiste, riceverai un messaggio con le istruzioni per reimpostare la password.',
        };
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
