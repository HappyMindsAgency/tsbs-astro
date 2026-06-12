// src/pages/api/user/tessera.ts
// Salva il numero tessera del membro e lo mette in verifica.
// La logica vive nel servizio condiviso src/lib/strapi/tessera.ts (riusato anche
// dalla Missione 1): questo endpoint è un wrapper sottile per la pagina Impostazioni.

import type { APIRoute } from 'astro';
import { inviaTesseraInVerifica } from '../../../lib/strapi/tessera';

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

    const result = await inviaTesseraInVerifica(jwt, body.tessera);

    if (!result.ok) {
        return json({ error: result.code, ...(result.message ? { message: result.message } : {}) }, result.status);
    }

    return json({ success: true, statoTessera: result.statoTessera });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}
