// src/pages/api/user/dati-aggiuntivi.ts

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

/** Recupera il Membro associato all'utente autenticato tramite admin token. */
async function getMembroForUser(jwt: string): Promise<{ documentId: string; datiAggiuntivi: Record<string, unknown> } | null> {
    const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    });
    if (!userRes.ok) return null;
    const user = await userRes.json();

    const qs = new URLSearchParams({ 'filters[user][id][$eq]': String(user.id) });
    const membroRes = await fetch(
        `${STRAPI_API_BASE_URL}/membri?${qs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );
    if (!membroRes.ok) return null;

    const membroData = await membroRes.json();
    const membro = membroData?.data?.[0];
    if (!membro) return null;

    return { documentId: membro.documentId, datiAggiuntivi: membro.datiAggiuntivi ?? {} };
}

/**
 * GET /api/user/dati-aggiuntivi
 * Restituisce il campo datiAggiuntivi del Membro corrente.
 * Risposta: { datiAggiuntivi: Record<string, unknown> }
 */
export const GET: APIRoute = async ({ cookies }) => {
    const jwt = cookies.get('jwt')?.value;
    if (!jwt) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const membro = await getMembroForUser(jwt);
    if (!membro) {
        return new Response(JSON.stringify({ error: 'membro_not_found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ datiAggiuntivi: membro.datiAggiuntivi }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
        },
    });
};

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

    const membro = await getMembroForUser(jwt);
    if (!membro) {
        logger.error('[DatiAggiuntivi] Membro non trovato per l\'utente corrente');
        return new Response(JSON.stringify({ error: 'membro_not_found' }), { status: 404 });
    }

    const membroId = membro.documentId;
    const datiAttuali = membro.datiAggiuntivi;

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
