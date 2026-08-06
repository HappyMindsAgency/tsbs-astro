// src/lib/rate-limit.ts
//
// Rate limiter minimale, fixed-window, in memoria di processo (no dipendenze esterne).
// Pensato per le route pubbliche di autenticazione (login, register, check-nickname,
// reset-password) per mitigare brute force / enumerazione / mail-bombing.
//
// ponytail: rate-limit in-memory, non condiviso tra istanze serverless Vercel -- se il
// traffico cresce servira' uno store esterno (Vercel KV/Upstash).

interface Bucket {
    count: number;
    windowStart: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Verifica ed aggiorna il contatore per `key` in una finestra fissa di `windowMs`.
 * Ritorna true se la richiesta e' consentita, false se il limite e' stato superato.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
        buckets.set(key, { count: 1, windowStart: now });
        return true;
    }

    if (bucket.count >= maxRequests) {
        return false;
    }

    bucket.count += 1;
    return true;
}

/** Estrae l'IP client dagli header standard dietro proxy (Vercel), con fallback. */
export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Risposta 429 generica (nessun dettaglio utile a un attaccante). */
export function tooManyRequestsResponse(message = 'Troppe richieste. Riprova più tardi.'): Response {
    return new Response(JSON.stringify({ error: message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
}
