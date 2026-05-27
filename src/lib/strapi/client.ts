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

	const response = await fetch(url, { headers });
	const payload = await response.json().catch(() => null);

	// Rende espliciti gli errori Strapi durante il rendering Astro.
	if (!response.ok) {
		const message = payload?.error?.message || `Strapi request failed with status ${response.status}`;
		throw new Error(message);
	}

	return payload as T;
}
