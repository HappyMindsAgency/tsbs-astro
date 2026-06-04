// src/pages/api/quiz/smistamento.ts
// Recupera le domande del quiz "Test Smistamento" da Strapi.
// Le domande vengono servite senza la risposta corretta (non esiste nel test di smistamento).

import type { APIRoute } from 'astro';
import { getMissioneBySlug } from '../../../lib/strapi/missioni';

const SORTING_TEST_SLUG = 'test-smistamento';

export const GET: APIRoute = async ({ cookies }) => {
    const jwt = cookies.get('jwt')?.value;

    if (!jwt) {
        return json({ error: 'unauthorized' }, 401);
    }

    let missione;
    try {
        missione = await getMissioneBySlug(SORTING_TEST_SLUG);
    } catch (err) {
        return json({ error: 'strapi_unreachable' }, 502);
    }

    if (!missione?.quiz) {
        return json({ error: 'quiz_not_found' }, 404);
    }

    const domande = (missione.quiz.domande ?? []).map((d) => ({
        domanda: d.domanda ?? '',
        risposte: (d.risposte ?? []).map((r) => ({
            risposta: r.risposta ?? '',
        })),
    }));

    return json({ domande });
};

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
}
