import type { Epistola, EpistolaLivello } from '../strapi/epistole';
import type { MissioneLivello } from '../strapi/missioni';

type EpistolaVisibilityContext = {
	accademiaMembro?: string | null;
	livelloMembro: MissioneLivello | null;
	testSmistamentoCompletato?: boolean;
};

const FIRST_EPISTOLA_LEVEL_ORDER = 2;
const LEVEL_ORDER_BY_SLUG: Record<string, number> = {
	'livello-1-adepto': 1,
	'livello-2-iniziato': 2,
	'livello-3-custode-novizio': 3,
	'livello-4-custode': 4,
};

function normalizeOrder(value: number | string | null | undefined) {
	const order = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
	return Number.isFinite(order) ? order : null;
}

function getLevelOrder(level: Pick<EpistolaLivello, 'slug' | 'ordine'> | Pick<MissioneLivello, 'slug' | 'ordine'> | null | undefined) {
	const explicitOrder = normalizeOrder(level?.ordine);
	if (explicitOrder !== null) return explicitOrder;

	const slug = level?.slug?.trim();
	if (slug && LEVEL_ORDER_BY_SLUG[slug]) return LEVEL_ORDER_BY_SLUG[slug];

	return null;
}

function getUnlockedEpistolaLevelOrder(currentLevel: MissioneLivello | null, hasCompletedSorting: boolean) {
	const currentLevelOrder = getLevelOrder(currentLevel);
	if (currentLevelOrder === null && hasCompletedSorting) return FIRST_EPISTOLA_LEVEL_ORDER;
	if (currentLevelOrder === null) return null;

	return Math.max(currentLevelOrder, FIRST_EPISTOLA_LEVEL_ORDER);
}

function isVisibleByAcademy(epistola: Epistola, academySlug: string | null | undefined) {
	const epistolaAcademy = epistola.accademia?.slug?.trim();
	if (!epistolaAcademy) return true;

	return Boolean(academySlug && epistolaAcademy === academySlug);
}

function isVisibleByLevel(epistola: Epistola, currentLevel: MissioneLivello | null, hasCompletedSorting: boolean) {
	const epistolaLevels = epistola.livellos ?? [];
	if (epistolaLevels.length === 0) return true;

	const unlockedLevelOrder = getUnlockedEpistolaLevelOrder(currentLevel, hasCompletedSorting);
	if (unlockedLevelOrder === null) return false;

	return epistolaLevels.some((level) => {
		const levelOrder = getLevelOrder(level);
		return levelOrder !== null && levelOrder <= unlockedLevelOrder;
	});
}

export function isEpistolaVisible(epistola: Epistola, context: EpistolaVisibilityContext) {
	return (
		isVisibleByAcademy(epistola, context.accademiaMembro) &&
		isVisibleByLevel(epistola, context.livelloMembro, context.testSmistamentoCompletato === true)
	);
}

export function sortEpistoleByDateDesc(a: Epistola, b: Epistola) {
	const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
	const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
	if (dateA !== dateB) return dateB - dateA;

	return a.titolo.localeCompare(b.titolo, 'it-IT');
}
