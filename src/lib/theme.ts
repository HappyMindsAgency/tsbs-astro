// Risolve il tema CSS dell'accademia per l'utente autenticato.
// Da usare nel frontmatter delle pagine SSR che non hanno un tema fisso.

import { getAuthenticatedUserAcademy, type AcademySlug } from './strapi/user-academy';

export type { AcademySlug } from './strapi/user-academy';

const SLUG_TO_THEME: Record<string, string> = {
	arborea: 'theme-arborea',
	arcadia: 'theme-arcadia',
	armonia: 'theme-armonia',
	astraria: 'theme-astraria',
};

export async function resolveUserAcademy(jwt: string | undefined): Promise<AcademySlug> {
	return (await getAuthenticatedUserAcademy(jwt)) ?? 'arborea';
}

export async function resolveUserTheme(jwt: string | undefined): Promise<string> {
	const slug = await resolveUserAcademy(jwt);
	return SLUG_TO_THEME[slug] ?? 'theme-arborea';
}

export async function resolveUserContext(jwt: string | undefined): Promise<{ theme: string; accademia: AcademySlug }> {
	const accademia = await resolveUserAcademy(jwt);
	return { accademia, theme: SLUG_TO_THEME[accademia] ?? 'theme-arborea' };
}
