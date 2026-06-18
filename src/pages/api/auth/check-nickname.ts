// src/pages/api/auth/check-nickname.ts
//
// Verifica "al volo" di uno username/nickname durante la registrazione:
//   1) formato valido;
//   2) non è una bad word (it stringente, en blando) né un nome riservato;
//   3) non è già usato da un altro utente.
//
// Pensato per essere chiamato sul blur del campo username (prima dell'invio).
// La validazione definitiva resta comunque in /api/auth/register.

import type { APIRoute } from 'astro';
import { isValidUsername } from '../../../utils/auth.utils';
import { isNicknameBlacklisted } from '../../../data/nicknameBlacklist';
import { containsBadWord } from '../../../data/badWords';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';
import { logger } from '../../../services/logger';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

type CheckReason = 'invalid' | 'badword' | 'taken' | 'error';

export const POST: APIRoute = async ({ request }) => {
    let body: { username?: unknown };

    try {
        body = await request.json();
    } catch {
        return jsonResponse({ ok: false, reason: 'invalid' }, 400);
    }

    const username = typeof body.username === 'string' ? body.username.trim() : '';

    if (!isValidUsername(username)) {
        return jsonResponse({ ok: false, reason: 'invalid' });
    }

    if (isNicknameBlacklisted(username) || containsBadWord(username)) {
        return jsonResponse({ ok: false, reason: 'badword' });
    }

    // --- Controllo unicità su Strapi (case-insensitive) ---
    try {
        const url = `${STRAPI_API_BASE_URL}/users?filters[username][$eqi]=${encodeURIComponent(username)}`;
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STRAPI_API}`,
            },
        });

        if (!res.ok) {
            logger.error(`[CheckNickname] Strapi lookup failed: ${res.status}`);
            // Non blocchiamo l'utente su un errore di rete: register resta la fonte di verità.
            return jsonResponse({ ok: false, reason: 'error' });
        }

        const data = await res.json();
        // users-permissions può restituire un array diretto oppure { data: [...] }.
        const list = Array.isArray(data) ? data : (data?.data ?? []);

        if (Array.isArray(list) && list.length > 0) {
            return jsonResponse({ ok: false, reason: 'taken' });
        }

        return jsonResponse({ ok: true });
    } catch (error) {
        logger.error('[CheckNickname] Unexpected error during uniqueness check:', error);
        return jsonResponse({ ok: false, reason: 'error' });
    }
};

function jsonResponse(payload: { ok: true } | { ok: false; reason: CheckReason }, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
