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
export function redirectWithLoginError(_baseUrl: string, error: LoginErrorCode, identifier: string = ''): Response {
    const params = new URLSearchParams({ error });
    if (identifier) params.set('identifier', identifier);
    return new Response(null, { status: 303, headers: { Location: `/?${params.toString()}` } });
}

/**
 * Crea una risposta di reindirizzamento all'atrio (successo login).
 */
export function redirectToAtrio(_baseUrl: string): Response {
    return new Response(null, { status: 303, headers: { Location: '/atrio/' } });
}

/** Durata massima della sessione: 24h (era 7gg). */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Timestamp (unix, secondi) di attivazione del limite di 24h.
 * Qualsiasi JWT emesso prima di questo istante (`iat` del token) viene
 * considerato scaduto anche se il suo cookie originale (7gg) non lo sarebbe
 * ancora: forza il re-login di tutte le sessioni pre-esistenti al deploy.
 * ponytail: costante statica volutamente, non uno "startup timestamp" dinamico:
 * un valore che si aggiorna da solo invaliderebbe le sessioni ad ogni deploy.
 */
export const SESSION_CUTOFF_UNIX = 1790084859;

/**
 * Decodifica (senza verifica di firma, non serve: la firma la verifica Strapi)
 * il campo `iat` di un JWT per poterlo confrontare con `SESSION_CUTOFF_UNIX`.
 */
function getJwtIssuedAt(jwt: string): number | null {
    try {
        const payload = jwt.split('.')[1];
        const json = Buffer.from(payload, 'base64').toString('utf-8');
        const { iat } = JSON.parse(json) as { iat?: number };
        return typeof iat === 'number' ? iat : null;
    } catch {
        return null;
    }
}

/**
 * true se il JWT è stato emesso dopo il cutoff dei 24h, quindi la sessione è
 * ancora valida secondo la nuova policy.
 */
export function isSessionWithinCutoff(jwt: string): boolean {
    const iat = getJwtIssuedAt(jwt);
    return iat !== null && iat >= SESSION_CUTOFF_UNIX;
}

/**
 * Imposta il cookie JWT per la sessione utente.
 * @param cookies L'oggetto `AstroCookies` fornito da Astro.
 * @param jwt Il token JWT da memorizzare.
 */
export function setAuthCookie(cookies: AstroCookies, jwt: string): void {
    const isProduction = import.meta.env.NODE_ENV === 'production';

    cookies.set('jwt', jwt, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });
}

/**
 * Restituisce il valore dell'header Set-Cookie per il JWT.
 * Usare quando si costruisce manualmente una Response (es. redirect) per evitare
 * il bug "immutable headers" dell'adapter Vercel.
 */
export function buildJwtCookieHeader(jwt: string): string {
    const isProduction = import.meta.env.NODE_ENV === 'production';
    const secure = isProduction ? '; Secure' : '';
    return `jwt=${jwt}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}`;
}

export class AuthServiceError extends Error {
    public code: LoginErrorCode;

    constructor(code: LoginErrorCode) {
        super(code);
        this.name = 'AuthServiceError';
        this.code = code;
    }
}

// ---------------------------------------------------------------------------
// Registrazione
// ---------------------------------------------------------------------------

/**
 * Codici di errore per la procedura di registrazione.
 */
export const RegistrationError = {
    MISSING_FIELDS: 'missing_fields',
    INVALID_EMAIL: 'invalid_email',
    INVALID_NICKNAME: 'invalid_nickname',
    NICKNAME_BLACKLISTED: 'nickname_blacklisted',
    WEAK_PASSWORD: 'weak_password',
    ALREADY_TAKEN: 'already_taken',
    EMAIL_ALREADY_REGISTERED: 'email_already_registered',
    INTERNAL_SERVER_ERROR: 'internal_server_error',
} as const;

export type RegistrationErrorCode = typeof RegistrationError[keyof typeof RegistrationError];

export class RegistrationServiceError extends Error {
    public code: RegistrationErrorCode;

    constructor(code: RegistrationErrorCode) {
        super(code);
        this.name = 'RegistrationServiceError';
        this.code = code;
    }
}

/**
 * Valida il formato di un username (solo lettere, numeri, punti, trattini, underscore — min 3 caratteri).
 */
export function isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_.-]{3,}$/.test(username);
}

/**
 * Valida la forza della password: minimo 8 caratteri, almeno una maiuscola e un numero.
 */
export function isStrongPassword(password: string): boolean {
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

/**
 * Valida il formato di un'email.
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
