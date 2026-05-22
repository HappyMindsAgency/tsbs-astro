import type { AstroCookies } from 'astro';

/**
 * Codici di errore per la procedura di login.
 */
export const LoginError = {
    MISSING_CREDENTIALS: 'missing_credentials',
    INVALID_IDENTIFIER_FORMAT: 'invalid_identifier_format',
    INVALID_CREDENTIALS: 'invalid_credentials',
    SESSION_CONFIG_ERROR: 'session_config_error',
    INTERNAL_SERVER_ERROR: 'internal_server_error',
} as const;

export type LoginErrorCode = typeof LoginError[keyof typeof LoginError];

/**
 * Valida il formato dell'identificativo (email o username).
 * @param identifier L'identificativo da validare.
 * @returns true se il formato è valido, false altrimenti.
 */
export function isValidIdentifier(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/; // Username: min 3 caratteri, alfanumerico, punti, trattini o underscore

    const isEmail = identifier.includes('@');
    return isEmail ? emailRegex.test(identifier) : usernameRegex.test(identifier);
}

/**
 * Crea una risposta di reindirizzamento alla pagina di login con un codice di errore.
 * @param baseUrl L'URL di base dell'applicazione.
 * @param error Il codice di errore da includere nella query string.
 * @param identifier L'identificativo da precompilare (opzionale).
 * @returns Una Response di redirect (303).
 */
export function redirectWithLoginError(baseUrl: string, error: LoginErrorCode, identifier: string = ''): Response {
    const url = new URL(`${baseUrl}/landing/login`);
    url.searchParams.set('error', error);
    if (identifier) {
        url.searchParams.set('identifier', identifier);
    }
    return Response.redirect(url.toString(), 303);
}

/**
 * Crea una risposta di reindirizzamento all'atrio (successo login).
 * @param baseUrl L'URL di base dell'applicazione.
 * @returns Una Response di redirect (303).
 */
export function redirectToAtrio(baseUrl: string): Response {
    return Response.redirect(`${baseUrl}/atrio`, 303);
}

/**
 * Imposta il cookie JWT per la sessione utente.
 * @param cookies L'oggetto `AstroCookies` fornito da Astro.
 * @param jwt Il token JWT da memorizzare.
 */
export function setAuthCookie(cookies: AstroCookies, jwt: string): void {
    const maxAgeInSeconds = 7 * 24 * 60 * 60; // 7 days

    // Assumendo che import.meta.env sia disponibile nel contesto di Astro per NODE_ENV
    const isProduction = import.meta.env.NODE_ENV === 'production';

    cookies.set('jwt', jwt, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeInSeconds,
    });
}

export class AuthServiceError extends Error {
    public code: LoginErrorCode;

    constructor(code: LoginErrorCode) {
        super(code);
        this.name = 'AuthServiceError';
        this.code = code;
    }
}