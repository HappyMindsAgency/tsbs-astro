// Endpoint una tantum per recuperare i trofei soglia (4/6/12/20) della Missione
// 06 non assegnati a causa della race condition di rispondiDomandaSfida
// (risolta col lock per-membro). Idempotente: rilanciabile senza rischio di
// doppie assegnazioni (assegnaTrofeoSeNuovo verifica sempre l'esistenza).
// Protetto dallo stesso token admin gia' usato per le scritture su Strapi:
// non e' un endpoint di prodotto, va invocato manualmente e puo' essere
// rimosso una volta confermato l'esito.
import type { APIRoute } from 'astro';
import { backfillTrofeiSogliaSfidaLettura } from '../../../lib/strapi/sfida-lettura';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const adminToken = import.meta.env.AUTH_READONLY;
	const header = request.headers.get('authorization');

	if (!adminToken || header !== `Bearer ${adminToken}`) {
		return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
	}

	const risultato = await backfillTrofeiSogliaSfidaLettura();
	return new Response(JSON.stringify(risultato), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
