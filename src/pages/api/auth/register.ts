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
import { logger } from '../../../services/logger';

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_URL;
const STRAPI_API = import.meta.env.AUTH_READONLY;

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

    if (isNicknameBlacklisted(username)) {
        logger.warn('[RegisterAPI] Blacklisted username attempt');
        return errorResponse(RegistrationError.NICKNAME_BLACKLISTED, 400);
    }

    if (!isStrongPassword(password)) {
        logger.warn('[RegisterAPI] Weak password');
        return errorResponse(RegistrationError.WEAK_PASSWORD, 400);
    }

    // --- Step 1: crea lo User su Strapi (/auth/local/register) ---

    const authService = new AuthService(STRAPI_API_BASE_URL, STRAPI_API);
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

    // --- Successo: imposta il cookie JWT e risponde ---

    setAuthCookie(cookies, jwt);
    logger.info(`[RegisterAPI] Registration complete for userId ${userId}`);
    return successResponse();
};

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
