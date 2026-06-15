// src/pages/api/auth/reset-password/confirm.ts
// Consuma il token di reset (a scadenza), imposta la nuova password e invia le
// due notifiche email (conferma all'utente + avviso alla Redazione) via mailer interno.
import type { APIRoute } from 'astro';
import { PasswordResetService } from '../../../../services/password-reset.service';
import { AuthService } from '../../../../services/auth.service';
import { logger } from '../../../../services/logger';
import { getStrapiApiUrl } from '../../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;
const TOKEN_EXPIRY_MINUTES = 15;

let passwordResetService: PasswordResetService | null = null;

function getService(): PasswordResetService {
    if (passwordResetService) return passwordResetService;
    const authService = new AuthService(STRAPI_API_BASE_URL, STRAPI_API);
    passwordResetService = new PasswordResetService(authService, {
        tokenExpiryMinutes: TOKEN_EXPIRY_MINUTES,
    });
    return passwordResetService;
}

interface RequestBody {
    token?: string;
    password?: string;
    passwordConfirmation?: string;
}

export const POST: APIRoute = async ({ request }) => {
    logger.info('[PasswordResetConfirmAPI] POST request ricevuta');

    let body: RequestBody;
    try {
        body = await request.json();
    } catch {
        return jsonResponse('Richiesta non valida.', 400);
    }

    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const passwordConfirmation = typeof body.passwordConfirmation === 'string' ? body.passwordConfirmation : '';

    try {
        const result = await getService().confirmPasswordReset(token, password, passwordConfirmation);
        return jsonResponse(result.message, result.status);
    } catch (error) {
        logger.error('[PasswordResetConfirmAPI] Errore inatteso:', error);
        return jsonResponse('Si è verificato un errore. Riprova più tardi.', 500);
    }
};

function jsonResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({ message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
