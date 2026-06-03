// src/lib/mailer.ts
//
// Modulo generico per l'invio di notifiche via email tramite Nodemailer.
// Inizializza il transporter una sola volta (singleton) e lo riutilizza tra le chiamate.
//
// Esempio d'uso:
//   import { sendNotification } from '../lib/mailer';
//   await sendNotification({
//     to: 'utente@esempio.it',
//     subject: 'Benvenuto!',
//     html: '<p>Grazie per esserti registrato.</p>',
//   });

import nodemailer, { type Transporter, type SentMessageInfo } from 'nodemailer';
import { logger } from '../services/logger';

// ---------------------------------------------------------------------------
// Template HTML — modifica qui colori, testi e struttura senza toccare la logica
// ---------------------------------------------------------------------------
// Placeholder supportati:
//   {{subject}}  — oggetto della mail (usato nell'header)
//   {{content}}  — corpo HTML specifico della mail (iniettato nel contenitore centrale)
// ---------------------------------------------------------------------------
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

  <!-- Wrapper esterno -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <!-- Card contenitore -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center"
                style="background-color:#1a1a2e;padding:32px 40px;">
              <!-- Sostituisci il testo con un <img> per il logo -->
              <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;">
                THE SECRET BOOKISH SOCIETY
              </span>
            </td>
          </tr>

          <!-- Corpo principale — {{content}} viene iniettato qui -->
          <tr>
            <td style="padding:40px 40px 32px;color:#333333;font-size:15px;line-height:1.6;">
              {{content}}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
                style="background-color:#f8f8f8;padding:24px 40px;border-top:1px solid #e8e8e8;
                       color:#999999;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 4px;">
                Hai ricevuto questa email perché sei iscritto a The Secret Bookish Society.
              </p>
              <p style="margin:0;">
                Se hai domande, contattaci all'indirizzo
                <a href="mailto:info@thesecretbookishsociety.it"
                   style="color:#666666;text-decoration:underline;">
                  info@thesecretbookishsociety.it
                </a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card contenitore -->

      </td>
    </tr>
  </table>
  <!-- /Wrapper esterno -->

</body>
</html>`;

// ---------------------------------------------------------------------------
// Configurazione transporter — singleton, inizializzato al primo utilizzo
// ---------------------------------------------------------------------------
let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
    if (_transporter) return _transporter;

    const host     = import.meta.env.SMTP_HOST;
    const port     = Number(import.meta.env.SMTP_PORT);   // stringa → numero
    const user     = import.meta.env.SMTP_USERNAME;
    const pass     = import.meta.env.SMTP_PASSWORD;

    if (!host || !port || !user || !pass) {
        throw new Error('[Mailer] Configurazione SMTP incompleta — controlla le variabili d\'ambiente SMTP_*');
    }

    // secure: false → STARTTLS (porta 2525); usare true solo con porta 465 (TLS implicito)
    _transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });

    logger.info('[Mailer] Transporter SMTP creato.');
    return _transporter;
}

// ---------------------------------------------------------------------------
// Tipo dei parametri della funzione pubblica
// ---------------------------------------------------------------------------
export interface NotificationPayload {
    /** Destinatario/i: singola stringa o array di indirizzi */
    to: string | string[];
    /** Oggetto della mail */
    subject: string;
    /** Contenuto HTML da iniettare nel template */
    html: string;
    /** Versione testuale di fallback — se omessa viene generata automaticamente */
    text?: string;
    /** Mittente — se omesso usa DEFAULT_FROM_EMAIL dal .env */
    from?: string;
}

// ---------------------------------------------------------------------------
// Funzione pubblica
// ---------------------------------------------------------------------------

/**
 * Invia una email usando il template HTML generico.
 * Il contenuto specifico (`html`) viene iniettato nell'area centrale del template.
 *
 * @throws propaga l'eccezione Nodemailer in caso di errore di invio
 */
export async function sendNotification(payload: NotificationPayload): Promise<SentMessageInfo> {
    const { to, subject, html, from } = payload;

    const sender = from ?? import.meta.env.DEFAULT_FROM_EMAIL;
    if (!sender) {
        throw new Error('[Mailer] Mittente non specificato e DEFAULT_FROM_EMAIL non impostato nel .env');
    }

    // Versione testuale: usa quella fornita o stripa i tag HTML come fallback minimale
    const text = payload.text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // Inietta il contenuto nel template
    const fullHtml = HTML_TEMPLATE
        .replace('{{subject}}', escapeHtml(subject))
        .replace('{{content}}', html);   // html è già markup — non va escaped

    const transporter = getTransporter();

    try {
        const info = await transporter.sendMail({
            from: sender,
            to,
            subject,
            text,
            html: fullHtml,
        });
        logger.info(`[Mailer] Email inviata — subject: "${subject}", to: ${Array.isArray(to) ? to.join(', ') : to}, messageId: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`[Mailer] Invio fallito — subject: "${subject}", to: ${Array.isArray(to) ? to.join(', ') : to}`, error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Verifica connessione SMTP — utile all'avvio in sviluppo
// ---------------------------------------------------------------------------

/**
 * Verifica che il transporter riesca a connettersi al server SMTP.
 * Chiama questa funzione all'avvio dell'app per un early-fail in caso di configurazione errata.
 */
export async function verifyMailerConnection(): Promise<void> {
    const transporter = getTransporter();
    await transporter.verify();
    logger.info('[Mailer] Connessione SMTP verificata con successo.');
}

// ---------------------------------------------------------------------------
// Helper interno
// ---------------------------------------------------------------------------
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
