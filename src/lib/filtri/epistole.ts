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

// Rimuove la sintassi Markdown e normalizza gli spazi per ottenere testo semplice.
function toPlainText(value: string | null | undefined) {
	if (!value) return '';

	return value
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/[#>*_\-~]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

// Estratto testuale limitato a un numero massimo di parole (default 40).
export function getEpistolaExcerptByWords(value: string | null | undefined, maxWords = 40) {
	const words = toPlainText(value).split(' ').filter(Boolean);
	if (words.length <= maxWords) return words.join(' ');

	return `${words.slice(0, maxWords).join(' ')}...`;
}

export function sortEpistoleByDateDesc(a: Epistola, b: Epistola) {
	const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
	const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
	if (dateA !== dateB) return dateB - dateA;

	return a.titolo.localeCompare(b.titolo, 'it-IT');
}

// Livello rappresentativo dell'epistola per l'ordinamento dell'archivio:
// il piu alto tra i livelli collegati. Le epistole globali (senza livellos) restano null.
function getEpistolaLevelOrder(epistola: Epistola) {
	const orders = (epistola.livellos ?? [])
		.map((level) => getLevelOrder(level))
		.filter((order): order is number => order !== null);

	return orders.length > 0 ? Math.max(...orders) : null;
}

// Match esatto di livello per l'epistola in evidenza:
// epistola senza livellos = globale (vale per ogni livello),
// altrimenti almeno un livello collegato deve coincidere con il livello effettivo dell'utente.
function matchesExactLevel(epistola: Epistola, effectiveLevelOrder: number | null) {
	const epistolaLevels = epistola.livellos ?? [];
	if (epistolaLevels.length === 0) return true;
	if (effectiveLevelOrder === null) return false;

	return epistolaLevels.some((level) => getLevelOrder(level) === effectiveLevelOrder);
}

/**
 * Seleziona l'epistola in evidenza (Atrio + featured /epistole):
 * stessa accademia (o globale), livello ESATTAMENTE uguale a quello dell'utente,
 * e tra i match quella con `ordine` minore. Se servono piu card, l'Atrio completa
 * con le successive epistole comunque visibili per accademia/progressione.
 */
export function selectFeaturedEpistola(epistole: Epistola[], context: EpistolaVisibilityContext) {
	return selectFeaturedEpistole(epistole, context, 1)[0] ?? null;
}

export function selectFeaturedEpistole(epistole: Epistola[], context: EpistolaVisibilityContext, limit = 2) {
	const effectiveLevelOrder = getUnlockedEpistolaLevelOrder(
		context.livelloMembro,
		context.testSmistamentoCompletato === true,
	);

	const exactLevelCandidates = epistole.filter(
		(epistola) =>
			isVisibleByAcademy(epistola, context.accademiaMembro) &&
			matchesExactLevel(epistola, effectiveLevelOrder),
	);
	const selected = exactLevelCandidates.sort(sortEpistoleByOrdineAsc).slice(0, limit);

	if (selected.length >= limit) return selected;

	const selectedIds = new Set(selected.map((epistola) => epistola.documentId));
	const fallbackCandidates = epistole
		.filter((epistola) => !selectedIds.has(epistola.documentId))
		.filter((epistola) => isEpistolaVisible(epistola, context))
		.sort(sortEpistoleByLevelDescThenOrdineDesc);

	return [...selected, ...fallbackCandidates].slice(0, limit);
}

// Ordinamento per `ordine` crescente (ordine minore prima); i null vanno in fondo.
function sortEpistoleByOrdineAsc(a: Epistola, b: Epistola) {
	const orderA = normalizeOrder(a.ordine);
	const orderB = normalizeOrder(b.ordine);
	if (orderA === null && orderB === null) return sortEpistoleByDateDesc(a, b);
	if (orderA === null) return 1;
	if (orderB === null) return -1;
	if (orderA !== orderB) return orderA - orderB;

	return sortEpistoleByDateDesc(a, b);
}

/**
 * Ordinamento dell'archivio /epistole: livello decrescente (es. 3, 2, 1) e,
 * a parita di livello, `ordine` decrescente. Le epistole globali (senza livello) vanno in fondo.
 */
export function sortEpistoleByLevelDescThenOrdineDesc(a: Epistola, b: Epistola) {
	// Ordinamento per livello desc, poi ordine desc. Le epistole senza accademia
	// rientrano nel flusso del proprio livello; quelle senza livello (level null) finiscono in fondo.
	const levelA = getEpistolaLevelOrder(a);
	const levelB = getEpistolaLevelOrder(b);
	if (levelA !== levelB) {
		if (levelA === null) return 1;
		if (levelB === null) return -1;
		return levelB - levelA;
	}

	const orderA = normalizeOrder(a.ordine);
	const orderB = normalizeOrder(b.ordine);
	if (orderA === null && orderB === null) return sortEpistoleByDateDesc(a, b);
	if (orderA === null) return 1;
	if (orderB === null) return -1;
	if (orderA !== orderB) return orderB - orderA;

	return sortEpistoleByDateDesc(a, b);
}
