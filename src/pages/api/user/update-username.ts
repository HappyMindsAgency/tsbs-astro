// src/pages/api/user/update-username.ts
import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
// Token applicativo usato server-side per le scritture su Strapi (stesso di membri/users altrove).
const STRAPI_API = import.meta.env.AUTH_READONLY;

export const POST: APIRoute = async ({ request, cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	if (!jwt) {
		return errorResponse('Sessione non valida. Effettua il login.', 401);
	}

	let body: { username?: string };
	try {
		body = await request.json();
	} catch {
		return errorResponse('Richiesta non valida.', 400);
	}

	const username = body.username?.trim() ?? '';

	if (username.length === 0) {
		return errorResponse('Il nome utente non può essere vuoto.', 400);
	}
	if (username.length < 3) {
		return errorResponse('Il nome utente deve contenere almeno 3 caratteri.', 400);
	}
	if (username.length > 30) {
		return errorResponse('Il nome utente non può superare i 30 caratteri.', 400);
	}

	// Header per identificare l'utente corrente (JWT) e per le scritture admin (token applicativo).
	const userHeader = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
	const adminHeader = { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' };

	// Recupera l'utente corrente: id per l'update e username originale per un eventuale rollback.
	const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: userHeader });
	if (!userRes.ok) {
		logger.warn('[UpdateUsername] /users/me fallito');
		return errorResponse('Sessione non valida.', 401);
	}
	const user = await userRes.json();
	const originalUsername: string = user.username ?? '';

	// Nessuna modifica effettiva.
	if (username === originalUsername) {
		return new Response(JSON.stringify({ message: 'Nessuna modifica da salvare.' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Recupera il Membro collegato PRIMA di scrivere: username (User) e nickname (Membro)
	// devono restare sempre allineati, quindi non procediamo se non possiamo aggiornarli entrambi.
	const membroQs = new URLSearchParams({ 'filters[user][id][$eq]': String(user.id) });
	const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${membroQs}`, { headers: adminHeader });
	const membroDocumentId: string | undefined = membroRes.ok
		? (await membroRes.json())?.data?.[0]?.documentId
		: undefined;

	if (!membroDocumentId) {
		logger.error(`[UpdateUsername] Membro non trovato per userId ${user.id}; sync nickname impossibile`);
		return errorResponse('Profilo non trovato. Riprova o contatta il supporto.', 404);
	}

	// 1) Aggiorna lo username sull'entità User (token applicativo: evita il 403 del JWT utente).
	//    Questa è anche la scrittura che fa scattare il vincolo di unicità dello username.
	const userUpdateRes = await fetch(`${STRAPI_API_BASE_URL}/users/${user.id}`, {
		method: 'PUT',
		headers: adminHeader,
		body: JSON.stringify({ username }),
	});

	if (!userUpdateRes.ok) {
		const data = await userUpdateRes.json().catch(() => ({}));
		const message = (data?.error?.message as string | undefined) ?? 'Errore durante l\'aggiornamento del nome utente.';
		logger.error(`[UpdateUsername] Strapi user error ${userUpdateRes.status}: ${message}`);

		if (message.toLowerCase().includes('already taken') || message.toLowerCase().includes('già in uso')) {
			return errorResponse('Nome utente già in uso. Scegline un altro.', 400);
		}
		return errorResponse(message, userUpdateRes.status);
	}

	// 2) Sincronizza Membro.nickname sullo stesso valore.
	const membroUpdateRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membroDocumentId}`, {
		method: 'PUT',
		headers: adminHeader,
		body: JSON.stringify({ data: { nickname: username } }),
	});

	if (!membroUpdateRes.ok) {
		const err = await membroUpdateRes.text();
		logger.error(`[UpdateUsername] Update nickname fallito per membro ${membroDocumentId}: ${err}`);

		// Rollback dello username per non lasciare User e Membro disallineati.
		const rollbackRes = await fetch(`${STRAPI_API_BASE_URL}/users/${user.id}`, {
			method: 'PUT',
			headers: adminHeader,
			body: JSON.stringify({ username: originalUsername }),
		});
		if (!rollbackRes.ok) {
			logger.error(`[UpdateUsername] ROLLBACK username fallito per userId ${user.id}: User e Membro disallineati`);
		}

		return errorResponse('Errore durante l\'aggiornamento del profilo. Riprova.', 500);
	}

	logger.info(`[UpdateUsername] Username e nickname aggiornati per userId ${user.id}`);
	return new Response(JSON.stringify({ message: 'Nome utente aggiornato con successo.' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

function errorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ message }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
