import type { APIRoute } from 'astro';

// Definizione dell'URL base dell'API Strapi.
const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_BASE_URL

export const POST: APIRoute = async ({ request, cookies }) => {
	// Recuperiamo l'URL di base dell'applicazione Astro per gestire i redirect futuri.
	const baseUrl = new URL(request.url).origin;

	try {
		const formData = await request.formData();
		const identifier = formData.get('identifier')?.toString()?.trim();
		const password = formData.get('password')?.toString();

		if (!identifier || !password) {
			console.warn('Validazione fallita: Campi incompleti.');
			return Response.redirect(`${baseUrl}/?error=Campi_obbligatori`, 303);
		}

		const strapiAuthUrl = `${STRAPI_API_BASE_URL}/auth/local`;
		const requestBody = { identifier, password };

		const strapiResponse = await fetch(strapiAuthUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody), // Uso corretto di JSON.stringify
		});

		const data = await strapiResponse.json();

		if (!strapiResponse.ok) {
			console.error('Strapi authentication failed!');
			const errorMessage = data.error?.message || 'Credenziali_non_valide';
			return Response.redirect(`${baseUrl}/?error=${encodeURIComponent(errorMessage)}`, 303);
		}

		const jwt = data.jwt;
		const user = data.user;

		if (jwt && user) {
			const maxAgeInSeconds = 7 * 24 * 60 * 60;

			// - httpOnly: Impedisce l'accesso tramite JavaScript (protezione XSS).
			// - secure: Il cookie viene inviato solo su connessioni HTTPS (essenziale in produzione).
			// - sameSite: 'lax' per mitigare attacchi CSRF.
			// - path: '/'; il cookie è valido per tutto il sito.
			cookies.set('jwt', jwt, {
				httpOnly: true,
				secure: import.meta.env.NODE_ENV === 'production', // Attiva 'secure' solo in produzione
				sameSite: 'lax',
				path: '/',
				maxAge: maxAgeInSeconds,
			});

			return Response.redirect(`${baseUrl}/atrio`, 303);
		} else {
			console.error('Strapi response was OK, but JWT or User data is missing.');
			return Response.redirect(`${baseUrl}/?error=Errore_configurazione_sessione`, 303);
		}

	} catch (error) {
		console.error('CRITICAL ERROR in Astro login API:', error);
		return Response.redirect(`${baseUrl}/?error=Errore_interno_server`, 303);
	}
};
