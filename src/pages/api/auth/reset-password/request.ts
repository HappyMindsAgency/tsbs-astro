// src/pages/api/auth/reset-password/request.ts
import type { APIRoute } from 'astro';
import { PasswordResetService } from '../../../../services/password-reset.service';
import { logger } from '../../../../services/logger';
import { AuthService } from '../../../../services/auth.service';
import { getStrapiApiUrl } from '../../../../lib/strapi/api-url';

// Configuration
const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;
const TOKEN_EXPIRY_MINUTES = 15;

// Inizializzazione lazy del servizio (singleton)
let passwordResetService: PasswordResetService | null = null;

function getService(): PasswordResetService {
    if (passwordResetService) return passwordResetService;

    const authService = new AuthService(STRAPI_API_BASE_URL, STRAPI_API);
    passwordResetService = new PasswordResetService(authService, {
        tokenExpiryMinutes: TOKEN_EXPIRY_MINUTES,
    });
    return passwordResetService;
}

/**
 * Ricava l'origin pubblico dell'app frontend.
 * In produzione l'app gira dietro il proxy Vercel: usare gli header x-forwarded-*,
 * non l'host della request che può risultare localhost.
 */
function getAppOrigin(request: Request): string {
    const headers = request.headers;
    const proto = headers.get('x-forwarded-proto') ?? 'https';
    const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? '';
    return `${proto}://${host}`;
}

interface RequestBody {
    email?: string;
}

export const POST: APIRoute = async ({ request }) => {
    logger.info('[PasswordResetAPI] POST request ricevuta');

    try {
        let requestBody: RequestBody;
        try {
            requestBody = await request.json();
        } catch {
            logger.warn('[PasswordResetAPI] JSON non valido nel body');
            return jsonResponse('Richiesta non valida.', 400);
        }

        const email = typeof requestBody.email === 'string' ? requestBody.email.trim() : '';
        if (!email) {
            return jsonResponse('L\'email è obbligatoria.', 400);
        }

        const resetLinkBase = `${getAppOrigin(request)}/auth/reset-password/conferma`;
        const result = await getService().requestPasswordReset(email, resetLinkBase);

        // Risposta sempre generica per evitare l'enumerazione delle email
        return jsonResponse(result.message, 200);
    } catch (error) {
        logger.error('[PasswordResetAPI] Errore inatteso:', error);
        return jsonResponse('Si è verificato un errore. Riprova più tardi.', 500);
    }
};

function jsonResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({ message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
