// src/pages/api/login.ts
import type { APIRoute } from 'astro';
import { LoginError, isValidIdentifier, redirectWithLoginError, redirectToAtrio, setAuthCookie, AuthServiceError } from '../../utils/auth.utils';
import { AuthService } from '../../services/auth.service'; 

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_BASE_URL
const STRAPI_API = import.meta.env.STRAPI_API; 

export const POST: APIRoute = async ({ request, cookies }) => {
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
            setAuthCookie(cookies, jwt);
			return redirectToAtrio(baseUrl);
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
