// src/pages/api/user/profilo.ts
// Aggrega User (users/me) + Membro (con accademia e livello) in una sola risposta.

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';
import { resolveAvatarSrc } from '../../../lib/avatar';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

export const GET: APIRoute = async ({ cookies }) => {
    const jwt = cookies.get('jwt')?.value;

    if (!jwt) {
        return json({ error: 'unauthorized' }, 401);
    }

    const authHeader = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };

    // Step 1: recupera utente corrente per ottenere l'ID
    const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: authHeader });

    if (!userRes.ok) {
        logger.warn(`[Profilo] /users/me fallito: ${userRes.status}`);
        if (userRes.status === 401 || userRes.status === 403) {
            return json({ error: 'unauthorized' }, 401);
        }
        return json({ error: 'user_fetch_failed' }, 500);
    }

    const user = await userRes.json();

    // Step 2: recupera il Membro collegato all'utente tramite il suo ID reale
    let membro: Record<string, unknown> | null = null;

    const qs = new URLSearchParams({
        'filters[user][id][$eq]': String(user.id),
        'fields[0]': 'tessera',
        'fields[1]': 'punti',
        'fields[2]': 'datiAggiuntivi',
        'fields[3]': 'statoTessera',
        'populate[0]': 'accademia',
        'populate[1]': 'livello',
    });
    const membroRes = await fetch(
        `${STRAPI_API_BASE_URL}/membri?${qs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );

    if (membroRes.ok) {
        const membroData = await membroRes.json();
        membro = membroData?.data?.[0] ?? null;
    } else {
        const errText = await membroRes.text();
        logger.warn(`[Profilo] /membri fallito: ${membroRes.status} — ${errText}`);
    }

    const datiAggiuntivi = (membro?.datiAggiuntivi as Record<string, unknown> | null) ?? {};
    const avatarId = (datiAggiuntivi?.avatar as string) ?? null;
    // statoTessera è ora un campo di primo livello su Strapi (enumeration)
    const statoTessera = (membro?.statoTessera as string) ?? 'nessuna';
    const tessera = normalizeLibraryCardCode((membro?.tessera as string | null) ?? '');

    return json({
        username: user.username ?? null,
        email: user.email ?? null,
        avatar: avatarId,
        avatarSrc: resolveAvatarSrc(avatarId),
        accademia: (membro?.accademia as Record<string, unknown> | null)?.nome ?? null,
        accademiaSlug: (membro?.accademia as Record<string, unknown> | null)?.slug ?? null,
        livello: (membro?.livello as Record<string, unknown> | null)?.nome ?? null,
        punti: (membro?.punti as number | null) ?? null,
        tessera: tessera || null,
        statoTessera,
    });
};

function normalizeLibraryCardCode(value: string) {
    return value.replace(/[\s-]+/g, '').trim();
}

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
}
