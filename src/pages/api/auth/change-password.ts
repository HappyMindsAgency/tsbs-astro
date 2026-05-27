// src/pages/api/auth/change-password.ts
import type { APIRoute } from 'astro';
import { setAuthCookie } from '../../../utils/auth.utils';

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_URL;

export const POST: APIRoute = async ({ request, cookies }) => {
	// 1. Verifica che l'utente sia autenticato
	const jwt = cookies.get('jwt')?.value;
	if (!jwt) {
		return errorResponse('Sessione non valida. Effettua il login.', 401);
	}

	// 2. Parsing del body JSON
	let body: { currentPassword?: string; password?: string; passwordConfirmation?: string };
	try {
		body = await request.json();
	} catch {
		return errorResponse('Richiesta non valida.', 400);
	}

	const { currentPassword, password, passwordConfirmation } = body;

	// 3. Validazione server-side
	if (!currentPassword || !password || !passwordConfirmation) {
		return errorResponse('Tutti i campi password sono obbligatori.', 400);
	}
	if (password !== passwordConfirmation) {
		return errorResponse('Le password non coincidono.', 400);
	}
	if (password.length < 8) {
		return errorResponse('La nuova password deve contenere almeno 8 caratteri.', 400);
	}

	// 4. Chiamata a Strapi v5 /api/auth/change-password
	try {
		const strapiUrl = `${STRAPI_API_BASE_URL}/auth/change-password`;


		const strapiResponse = await fetch(strapiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${jwt}`,
			},
			body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
		});

		const data = await strapiResponse.json();

		if (!strapiResponse.ok) {
			const message = data?.error?.message ?? 'Errore durante il cambio password.';
			console.error('[ChangePasswordAPI] Strapi error:', strapiResponse.status, message);
			return errorResponse(message, strapiResponse.status);
		}

		// 5. Aggiorna il cookie con il nuovo JWT restituito da Strapi
		if (data.jwt) {
			setAuthCookie(cookies, data.jwt);
		}

		return successResponse('Password aggiornata con successo.');
	} catch (error) {
		console.error('[ChangePasswordAPI] Unexpected error:', error);
		return errorResponse('Errore interno. Riprova più tardi.', 500);
	}
};

function successResponse(message: string): Response {
	return new Response(JSON.stringify({ message }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

function errorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ message }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
