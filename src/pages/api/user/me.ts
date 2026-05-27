// src/pages/api/user/me.ts
import type { APIRoute } from 'astro';

// Definizione dell'URL base dell'API Strapi.
// NOTA: Come per login.ts, questo dovrebbe idealmente essere una variabile d'ambiente.
const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_URL;

export const GET: APIRoute = async ({ request, cookies }) => {
	// 1. Recupera il token JWT dal cookie HttpOnly impostato durante il login.
	const jwt = cookies.get('jwt')?.value;

	// Se il cookie 'jwt' non è presente, l'utente non è autenticato.
	if (!jwt) {
		console.warn('Richiesta a /api/user/me senza JWT nel cookie.');
		return new Response(JSON.stringify({ message: 'Unauthorized: No JWT found.' }), {
			status: 401, // Unauthorized
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	try {
		// 2. Utilizza il JWT per fare una richiesta autenticata all'endpoint /users/me di Strapi.
		const strapiUserUrl = `${STRAPI_API_BASE_URL}/users/me`;

		const strapiResponse = await fetch(strapiUserUrl, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${jwt}`,
				'Content-Type': 'application/json',
			},
		});

		const userData = await strapiResponse.json();

		// 3. Gestisce eventuali errori restituiti da Strapi.
		if (!strapiResponse.ok) {
			console.error(`Strapi /users/me failed with status ${strapiResponse.status}:`, userData);

			if (strapiResponse.status === 401 || strapiResponse.status === 403) {
				// Rimuove il cookie JWT. Nota: il path '/' è importante per garantire la rimozione corretta.
				cookies.delete('jwt', { path: '/' });
				return new Response(JSON.stringify({ message: 'Unauthorized: Invalid or expired token.' }), {
					status: 401,
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
			// Per altri errori (es. 500 da Strapi), restituisci un errore generico del server.
			return new Response(JSON.stringify({ message: 'Error fetching user data from Strapi.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}

		// Questi header istruiscono il browser a non cachare questa risposta.
		const headers = {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
			'Pragma': 'no-cache', // Per compatibilità HTTP/1.1
			'Expires': '0',       // Per compatibilità con proxy
		};

		// 4. Se la richiesta a Strapi ha successo, restituisce i dati dell'utente al frontend.
		return new Response(JSON.stringify(userData), {
			status: 200, // OK
			headers: headers,
		});

	} catch (error) {
		console.error('CRITICAL ERROR in /api/user/me:', error);
		return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
};
