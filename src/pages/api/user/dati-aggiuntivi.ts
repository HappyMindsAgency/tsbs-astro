// src/pages/api/user/dati-aggiuntivi.ts

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

export const PUT: APIRoute = async ({ request, cookies }) => {
    const jwt = cookies.get('jwt')?.value;

    if (!jwt) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    let updates: Record<string, unknown>;

    try {
        updates = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 });
    }

    const authHeader = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };

    // Step 1: recupera l'ID utente corrente
    const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: authHeader });
    if (!userRes.ok) {
        logger.error('[DatiAggiuntivi] /users/me fallito');
        return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }
    const user = await userRes.json();
    const userId: number = user.id;

    // Step 2: trova il Membro collegato a quell'utente (richiede token admin)
    const qs = new URLSearchParams({
        'filters[user][id][$eq]': String(userId),
    });
    const membroRes = await fetch(
        `${STRAPI_API_BASE_URL}/membri?${qs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );

    if (!membroRes.ok) {
        const errText = await membroRes.text();
        logger.error(`[DatiAggiuntivi] GET membri fallito ${membroRes.status}: ${errText}`);
        return new Response(JSON.stringify({ error: 'membro_not_found' }), { status: 404 });
    }

    const membroData = await membroRes.json();
    const membro = membroData?.data?.[0];

    if (!membro) {
        logger.warn('[DatiAggiuntivi] Nessun Membro trovato per l\'utente corrente');
        return new Response(JSON.stringify({ error: 'membro_not_found' }), { status: 404 });
    }

    const membroId: string = membro.documentId;
    const datiAttuali: Record<string, unknown> = membro.datiAggiuntivi ?? {};

    // Merge shallow: i campi passati sovrascrivono quelli esistenti, gli altri restano
    const datiAggiornati = { ...datiAttuali, ...updates };

    const updateUrl = `${STRAPI_API_BASE_URL}/membri/${membroId}`;

    const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${STRAPI_API}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { datiAggiuntivi: datiAggiornati } }),
    });

    if (!updateRes.ok) {
        const err = await updateRes.text();
        logger.error(`[DatiAggiuntivi] Aggiornamento fallito per membroId ${membroId}: ${err}`);
        return new Response(JSON.stringify({ error: 'update_failed' }), { status: 500 });
    }

    logger.info(`[DatiAggiuntivi] datiAggiuntivi aggiornati per membroId ${membroId}`);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
