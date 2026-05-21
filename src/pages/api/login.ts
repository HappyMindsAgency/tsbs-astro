import type { APIRoute } from 'astro';

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_BASE_URL

export const POST: APIRoute = async ({ request, cookies }) => {
	const baseUrl = new URL(request.url).origin;

	try {
		// simula internal_server_error
		// throw new Error("Simulated Crash");
		const formData = await request.formData();
		const identifier = formData.get('identifier')?.toString()?.trim();
		const password = formData.get('password')?.toString();

		// identifier e password sono campi definiti required nel from di login nel file /landing/login/index.astro ma per sicurezza c'è questo controllo
		if (!identifier || !password) {
			console.warn('Validazione fallita: Campi incompleti.');
			return Response.redirect(`${baseUrl}/landing/login?error=missing_credentials&identifier=${encodeURIComponent(identifier || '')}`, 303);
		}

		// TODO: Matchare i veri valori presenti su strapi
		// TODO: Da spostare su register una volta creato il form di registrazione
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/; // Username: min 3 caratteri, alfanumerico, punti, trattini o underscore

		const isEmail = identifier.includes('@');
		const isValidFormat = isEmail ? emailRegex.test(identifier) : usernameRegex.test(identifier);

		if (!isValidFormat) {
			console.warn('Validazione fallita: Formato identificativo non valido.', identifier);
			return Response.redirect(`${baseUrl}/landing/login?error=invalid_identifier_format&identifier=${encodeURIComponent(identifier)}`, 303);
		}

		const strapiAuthUrl = `${STRAPI_API_BASE_URL}/auth/local`;
		const requestBody = { identifier, password };

		const strapiResponse = await fetch(strapiAuthUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		const data = await strapiResponse.json();

		if (!strapiResponse.ok) {
			console.error('Strapi authentication failed!');
			return Response.redirect(`${baseUrl}/landing/login?error=invalid_credentials&identifier=${encodeURIComponent(identifier || '')}`, 303);
		}

		// simula session_config_error
		// const jwt = null;
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
			return Response.redirect(`${baseUrl}/landing/login?error=session_config_error&identifier=${encodeURIComponent(identifier || '')}`, 303);
		}

	} catch (error) {
		if (import.meta.env.NODE_ENV === 'production') {
			console.error('CRITICAL ERROR in Astro login API: An unexpected error occurred.');
		} else {
			console.error('CRITICAL ERROR in Astro login API:', error);
		}
		// .clone() è necessario perchè il body di una request può essere letto solo una volta
		// .catch(() => null) è necessario perchè se la request non ha un body formData() fallisce assegnamo al form un valore nullo e continuiamo l'esecuzione
		const formData = await request.clone().formData().catch(() => null);
		const identifier = formData?.get('identifier')?.toString() || '';
		return Response.redirect(`${baseUrl}/landing/login?error=internal_server_error&identifier=${encodeURIComponent(identifier)}`, 303);
	}
};
