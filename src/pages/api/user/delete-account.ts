// src/pages/api/user/delete-account.ts
// Elimina il membro e l'utente autenticato corrente dal CMS.
// Ordine: membro → utente (evita vincoli relazionali orfani).

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API = import.meta.env.AUTH_READONLY;

export const DELETE: APIRoute = async ({ cookies }) => {
    const jwt = cookies.get('jwt')?.value;

    if (!jwt) {
        return json({ error: 'unauthorized' }, 401);
    }

    const STRAPI_API_BASE_URL = getStrapiApiUrl();
    const authHeader = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
    const adminHeader = { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' };

    // 1. Recupera l'utente corrente
    const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: authHeader });
    if (!userRes.ok) {
        return json({ error: 'unauthorized' }, 401);
    }
    const user = await userRes.json();

    // 2. Trova il membro collegato tramite email
    const qs = new URLSearchParams({
        'filters[email][$eq]': String(user.email),
        'status': 'draft',
    });
    const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${qs}`, { headers: adminHeader });

    if (!membroRes.ok) {
        logger.error(`[DeleteAccount] Lookup membro fallito: ${membroRes.status}`);
        return json({ error: 'membro_not_found' }, 404);
    }

    const membroData = await membroRes.json();
    const membro = membroData?.data?.[0];

    // 3. Elimina il membro (se esiste)
    if (membro?.documentId) {
        const deleteMembroRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membro.documentId}`, {
            method: 'DELETE',
            headers: adminHeader,
        });

        if (!deleteMembroRes.ok) {
            const err = await deleteMembroRes.text();
            logger.error(`[DeleteAccount] DELETE membro fallito: ${err}`);
            return json({ error: 'delete_membro_failed' }, 500);
        }

        logger.info(`[DeleteAccount] Membro ${membro.documentId} eliminato`);
    }

    // 4. Elimina l'utente
    const deleteUserRes = await fetch(`${STRAPI_API_BASE_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: adminHeader,
    });

    if (!deleteUserRes.ok) {
        const err = await deleteUserRes.text();
        logger.error(`[DeleteAccount] DELETE user fallito: ${err}`);
        return json({ error: 'delete_user_failed' }, 500);
    }

    logger.info(`[DeleteAccount] Utente ${user.id} eliminato`);

    // 5. Invalida il cookie JWT
    cookies.delete('jwt', { path: '/' });

    return json({ success: true });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}
