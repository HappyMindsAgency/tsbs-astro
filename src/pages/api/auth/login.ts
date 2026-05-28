// src/pages/api/login.ts
import type { APIRoute } from 'astro';
import { LoginError, isValidIdentifier, redirectWithLoginError, buildJwtCookieHeader, AuthServiceError } from '../../../utils/auth.utils';
import { AuthService } from '../../../services/auth.service';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

export const POST: APIRoute = async ({ request }) => {
	const baseUrl = new URL(request.url).origin;
	let identifier = '';

	try {
		const formData = await request.formData();
		identifier = formData.get('identifier')?.toString()?.trim() || '';
		const password = formData.get('password')?.toString();

		if (!identifier || !password) {
			console.warn('Validazione fallita: Campi incompleti.');
			return redirectWithLoginError(baseUrl, LoginError.MISSING_CREDENTIALS, identifier);
		}

		if (!isValidIdentifier(identifier)) {
			console.warn('Validazione fallita: Formato identificativo non valido.', identifier);
			return redirectWithLoginError(baseUrl, LoginError.INVALID_IDENTIFIER_FORMAT, identifier);
		}

		const authService = new AuthService(STRAPI_API_BASE_URL, STRAPI_API);
		const { jwt, user } = await authService.authenticateUser(identifier, password);

		// simula session_config_error
		// jwt = ''; // Simula una risposta di Strapi senza JWT
		if (jwt && user) {
            // Registra l'ultimo login in background — nessun blocco sul redirect in caso di errore
            fetch(`${baseUrl}/api/user/dati-aggiuntivi`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Cookie': `jwt=${jwt}` },
                body: JSON.stringify({ ultimoLogin: new Date().toISOString() }),
            }).catch(() => {});

            // Costruiamo la redirect manualmente per poter allegare Set-Cookie senza
            // incappare nel bug "immutable headers" dell'adapter Vercel (appendHeader su
            // una Response già sealed dal runtime).
            return new Response(null, {
                status: 303,
                headers: {
                    'Location': `${baseUrl}/atrio`,
                    'Set-Cookie': buildJwtCookieHeader(jwt),
                },
            });
		} else {
			console.error('Strapi response was OK, but JWT or User data is missing.');
			return redirectWithLoginError(baseUrl, LoginError.SESSION_CONFIG_ERROR, identifier);
		}

	} catch (error) {
		let errorCode: any = LoginError.INTERNAL_SERVER_ERROR;

		if (error instanceof AuthServiceError) {
			errorCode = error.code;
			console.warn(`Auth service error: ${errorCode}`);
		} else {
			if (import.meta.env.NODE_ENV === 'production') {
				console.error('CRITICAL ERROR in Astro login API: An unexpected error occurred.');
			} else {
				console.error('CRITICAL ERROR in Astro login API:', error);
			}
		}
		
		return redirectWithLoginError(baseUrl, errorCode, identifier);
	}
};


