export type StrapiCollectionResponse<T> = {
	data?: T[];
	error?: {
		message?: string;
		status?: number;
	};
};

// Normalizza la base API Strapi partendo dalle variabili ambiente.
function getStrapiApiBaseUrl() {
	const rawBaseUrl = import.meta.env.STRAPI_API_URL || import.meta.env.STRAPI_URL;

	if (!rawBaseUrl) {
		throw new Error('STRAPI_API_URL or STRAPI_URL is required.');
	}

	const baseUrl = String(rawBaseUrl).replace(/\/+$/, '');
	return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

// Ritenta una fetch verso Strapi solo su errori transitori (network error,
// timeout, status 5xx) — MAI su 4xx, che sono errori del chiamante e non si
// risolvono ritentando. Ogni tentativo ha un timeout esplicito via
// AbortSignal.timeout; tra un tentativo e l'altro c'e un backoff crescente.
// Worst-case: 3 tentativi x 7s + attese di 500ms e 1500ms ≈ 23s, entro il
// budget di ~25s assunto da maxDuration:30 in astro.config.mjs.
const RETRY_DELAYS_MS = [500, 1500];
const PER_ATTEMPT_TIMEOUT_MS = 7000;

export async function fetchStrapiWithRetry(url: string | URL, init: RequestInit = {}): Promise<Response> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
		try {
			const response = await fetch(url, { ...init, signal: AbortSignal.timeout(PER_ATTEMPT_TIMEOUT_MS) });
			if (response.ok || response.status < 500) {
				return response; // successo, oppure 4xx: non ritentabile
			}
			lastError = new Error(`Strapi request failed with status ${response.status}`);
		} catch (err) {
			lastError = err; // network error o timeout (AbortError)
		}

		if (attempt < RETRY_DELAYS_MS.length) {
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
		}
	}

	throw lastError instanceof Error ? lastError : new Error('Strapi request failed');
}

// Wrapper comune per le richieste Strapi server-side.
export async function fetchStrapi<T>(path: string, searchParams: URLSearchParams) {
	const apiBaseUrl = getStrapiApiBaseUrl();
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const url = new URL(`${apiBaseUrl}${normalizedPath}`);

	searchParams.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	const headers: HeadersInit = {
		Accept: 'application/json',
	};

	// Token readonly usato per contenuti pubblici non esposti al ruolo public.
	if (import.meta.env.AUTH_READONLY) {
		headers.Authorization = `Bearer ${import.meta.env.AUTH_READONLY}`;
	}

	const response = await fetchStrapiWithRetry(url, { headers });
	const payload = await response.json().catch(() => null);

	// Rende espliciti gli errori Strapi durante il rendering Astro.
	if (!response.ok) {
		const message = payload?.error?.message || `Strapi request failed with status ${response.status}`;
		throw new Error(message);
	}

	return payload as T;
}
