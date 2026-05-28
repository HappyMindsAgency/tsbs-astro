// src/pages/api/user/profilo.ts
// Aggrega User (users/me) + Membro (con accademia e livello) in una sola risposta.

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';
import avatar01 from '../../../assets/Avatar_01_tartaruga.svg';
import avatar02 from '../../../assets/Avatar_02_ampolla.svg';
import avatar03 from '../../../assets/Avatar_03_fantasma.svg';
import avatar04 from '../../../assets/Avatar_04_candela.svg';
import avatar05 from '../../../assets/Avatar_05_penna_calamaio.svg';
import avatar06 from '../../../assets/Avatar_06_pavone.svg';
import avatar07 from '../../../assets/Avatar_07_libro.svg';
import avatar08 from '../../../assets/Avatar_08_piccione.svg';
import avatar09 from '../../../assets/Avatar_09_gatto1.svg';
import avatar10 from '../../../assets/Avatar_10_gatto2.svg';
import avatar11 from '../../../assets/Avatar_11_gatto3.svg';
import avatar12 from '../../../assets/Avatar_12_gatto4.svg';

const AVATAR_SRC_MAP: Record<string, string> = {
    'avatar-1': avatar01.src,
    'avatar-2': avatar02.src,
    'avatar-3': avatar03.src,
    'avatar-4': avatar04.src,
    'avatar-5': avatar05.src,
    'avatar-6': avatar06.src,
    'avatar-7': avatar07.src,
    'avatar-8': avatar08.src,
    'avatar-9': avatar09.src,
    'avatar-10': avatar10.src,
    'avatar-11': avatar11.src,
    'avatar-12': avatar12.src,
};

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;
const LIBRARY_CARD_CODE_PATTERN = /^\d{14}$/;

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

    const avatarId = ((membro?.datiAggiuntivi as Record<string, unknown> | null)?.avatar as string) ?? null;
    const tessera = normalizeLibraryCardCode((membro?.tessera as string | null) ?? '');

    return json({
        username: user.username ?? null,
        email: user.email ?? null,
        avatar: avatarId,
        avatarSrc: avatarId ? (AVATAR_SRC_MAP[avatarId] ?? null) : null,
        accademia: (membro?.accademia as Record<string, unknown> | null)?.nome ?? null,
        accademiaSlug: (membro?.accademia as Record<string, unknown> | null)?.slug ?? null,
        livello: (membro?.livello as Record<string, unknown> | null)?.nome ?? null,
        punti: (membro?.punti as number | null) ?? null,
        tessera: LIBRARY_CARD_CODE_PATTERN.test(tessera) ? tessera : null,
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
