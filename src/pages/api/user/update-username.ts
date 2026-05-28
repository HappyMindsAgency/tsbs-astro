// src/pages/api/user/update-username.ts
import type { APIRoute } from 'astro';
import { logger } from '../../../services/logger';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();

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

	const { username } = body;

	if (!username || username.trim().length === 0) {
		return errorResponse('Il nome utente non può essere vuoto.', 400);
	}
	if (username.trim().length < 3) {
		return errorResponse('Il nome utente deve contenere almeno 3 caratteri.', 400);
	}
	if (username.trim().length > 30) {
		return errorResponse('Il nome utente non può superare i 30 caratteri.', 400);
	}

	const authHeader = { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };

	// Recupera l'ID utente corrente
	const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, { headers: authHeader });
	if (!userRes.ok) {
		logger.warn('[UpdateUsername] /users/me fallito');
		return errorResponse('Sessione non valida.', 401);
	}
	const user = await userRes.json();

	// Aggiorna lo username su Strapi
	const updateRes = await fetch(`${STRAPI_API_BASE_URL}/users/${user.id}`, {
		method: 'PUT',
		headers: authHeader,
		body: JSON.stringify({ username: username.trim() }),
	});

	if (!updateRes.ok) {
		const data = await updateRes.json().catch(() => ({}));
		const message = (data?.error?.message as string | undefined) ?? 'Errore durante l\'aggiornamento del nome utente.';
		logger.error(`[UpdateUsername] Strapi error ${updateRes.status}: ${message}`);

		if (message.toLowerCase().includes('already taken') || message.toLowerCase().includes('già in uso')) {
			return errorResponse('Nome utente già in uso. Scegline un altro.', 400);
		}
		return errorResponse(message, updateRes.status);
	}

	logger.info(`[UpdateUsername] Username aggiornato per userId ${user.id}`);
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
