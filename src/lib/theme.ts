// Risolve il tema CSS dell'accademia per l'utente autenticato.
// Da usare nel frontmatter delle pagine SSR che non hanno un tema fisso.

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_URL;
const STRAPI_API = import.meta.env.AUTH_READONLY;

const SLUG_TO_THEME: Record<string, string> = {
	arborea: 'theme-arborea',
	arcadia: 'theme-arcadia',
	armonia: 'theme-armonia',
	astraria: 'theme-astraria',
};

export async function resolveUserTheme(jwt: string | undefined): Promise<string> {
	if (!jwt) return 'theme-arborea';

	try {
		const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
			headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
		});
		if (!userRes.ok) return 'theme-arborea';
		const user = await userRes.json();

		const qs = new URLSearchParams({
			'filters[user][id][$eq]': String(user.id),
			'populate[0]': 'accademia',
			'fields[0]': 'id',
		});
		const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${qs}`, {
			headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		});
		if (!membroRes.ok) return 'theme-arborea';

		const membroData = await membroRes.json();
		const slug: string | undefined = membroData?.data?.[0]?.accademia?.slug;

		return SLUG_TO_THEME[slug ?? ''] ?? 'theme-arborea';
	} catch {
		return 'theme-arborea';
	}
}
