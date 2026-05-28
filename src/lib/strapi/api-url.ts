export function getStrapiApiUrl(): string {
	const direct = import.meta.env.STRAPI_API_URL;
	if (direct) return String(direct).replace(/\/+$/, '');
	const base = import.meta.env.STRAPI_URL;
	if (base) return `${String(base).replace(/\/+$/, '')}/api`;
	throw new Error('Missing env var: set STRAPI_API_URL (e.g. https://your-strapi.com/api) in Vercel project settings.');
}
