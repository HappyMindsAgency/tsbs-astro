// src/pages/api/user/accademia.ts
// Salva la relazione accademia sul Membro dell'utente autenticato.

import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

const VALID_ACADEMIES = ['arborea', 'arcadia', 'armonia', 'astraria'];
// Il completamento del test di smistamento promuove il Membro al Livello 2 - Iniziato.
const SMISTAMENTO_LEVEL_SLUG = 'livello-2-iniziato';

export const PUT: APIRoute = async ({ request, cookies }) => {
    const jwt = cookies.get('jwt')?.value;

    if (!jwt) {
        return json({ error: 'unauthorized' }, 401);
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'invalid_body' }, 400);
    }

    const accademiaSlug = typeof body.accademia === 'string' ? body.accademia : '';

    if (!VALID_ACADEMIES.includes(accademiaSlug)) {
        return json({ error: 'invalid_academy' }, 400);
    }

    const authHeader = { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' };

    // Recupera utente corrente
    const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: authHeader });
    if (!userRes.ok) {
        return json({ error: 'unauthorized' }, 401);
    }
    const user = await userRes.json();

    // Trova il Membro collegato allo User (stesso pattern di dati-aggiuntivi.ts).
    const qs = new URLSearchParams({
        'filters[user][id][$eq]': String(user.id),
    });
    const membroRes = await fetch(
        `${STRAPI_API_BASE_URL}/membri?${qs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );

    if (!membroRes.ok) {
        return json({ error: 'membro_not_found' }, 404);
    }

    const membroData = await membroRes.json();
    const membro = membroData?.data?.[0];

    if (!membro) {
        return json({ error: 'membro_not_found' }, 404);
    }

    // Trova il documentId dell'accademia tramite slug
    const accQs = new URLSearchParams({
        'filters[slug][$eq]': accademiaSlug,
        'fields[0]': 'documentId',
        'status': 'published',
    });
    const accRes = await fetch(
        `${STRAPI_API_BASE_URL}/accademie?${accQs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );

    if (!accRes.ok) {
        logger.error(`[Accademia] Lookup accademia fallito: ${accRes.status}`);
        return json({ error: 'academy_not_found' }, 404);
    }

    const accData = await accRes.json();
    const accademiaDocumentId: string | undefined = accData?.data?.[0]?.documentId;

    if (!accademiaDocumentId) {
        return json({ error: 'academy_not_found' }, 404);
    }

    // Il completamento del test di smistamento promuove il Membro al Livello 2 - Iniziato.
    const levelQs = new URLSearchParams({
        'filters[slug][$eq]': SMISTAMENTO_LEVEL_SLUG,
        'fields[0]': 'documentId',
        'status': 'published',
    });
    const levelRes = await fetch(
        `${STRAPI_API_BASE_URL}/livelli?${levelQs}`,
        { headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' } },
    );

    if (!levelRes.ok) {
        logger.error(`[Accademia] Lookup livello iniziale fallito: ${levelRes.status}`);
        return json({ error: 'level_not_found' }, 404);
    }

    const levelData = await levelRes.json();
    const levelDocumentId: string | undefined = levelData?.data?.[0]?.documentId;

    if (!levelDocumentId) {
        return json({ error: 'level_not_found' }, 404);
    }

    // Aggiorna il Membro con accademia e livello raggiunto (Livello 2 - Iniziato).
    const updateRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membro.documentId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: {
                accademia: { connect: [{ documentId: accademiaDocumentId }] },
                livello: { connect: [{ documentId: levelDocumentId }] },
            },
        }),
    });

    if (!updateRes.ok) {
        const err = await updateRes.text();
        logger.error(`[Accademia] Update membro fallito: ${err}`);
        return json({ error: 'update_failed' }, 500);
    }

    logger.info(`[Accademia] Accademia "${accademiaSlug}" salvata per membro ${membro.documentId}`);
    return json({ success: true, accademia: accademiaSlug });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}
