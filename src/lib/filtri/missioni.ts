import type { Missione, MissioneLivello, PartecipazioneMissione } from '../strapi/missioni';

export type MissionCard = {
	title: string;
	description: string;
	href: string;
	progress: number;
	meta: string;
};

export type MissionTab = {
	id: string;
	label: string;
	missions: MissionCard[];
};

const TEST_SMISTAMENTO_SLUG = 'test-smistamento';
const FIRST_MISSION_LEVEL_ORDER = 2;
const LEVEL_ORDER_BY_SLUG: Record<string, number> = {
	'livello-1-adepto': 1,
	'livello-2-iniziato': 2,
	'livello-3-custode-novizio': 3,
	'livello-4-custode': 4,
};

export function getPlainText(value: string | null | undefined) {
	if (!value) return '';
	return value
		.replace(/[#*_>`[\]()]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function getExcerpt(value: string | null | undefined) {
	const plainText = getPlainText(value);
	if (!plainText) return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	if (plainText.length <= 110) return plainText;

	return `${plainText.slice(0, 107).trim()}...`;
}

export function normalizeProgress(value: string | null | undefined, fallback = 0) {
	if (!value) return fallback;

	const progress = Number.parseFloat(value.replace(',', '.').replace('%', '').trim());
	if (!Number.isFinite(progress)) return fallback;

	return Math.min(100, Math.max(0, Math.round(progress)));
}

export function normalizeOrder(value: number | string | null | undefined) {
	const order = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
	return Number.isFinite(order) ? order : null;
}

export function getLevelOrder(level: MissioneLivello | null | undefined) {
	const explicitOrder = normalizeOrder(level?.ordine);
	if (explicitOrder !== null) return explicitOrder;

	const slug = level?.slug?.trim();
	if (slug && LEVEL_ORDER_BY_SLUG[slug]) return LEVEL_ORDER_BY_SLUG[slug];

	return null;
}

export function getMissionProgress(partecipazione: PartecipazioneMissione | undefined) {
	if (partecipazione?.stato === 'completata') return 100;
	return normalizeProgress(partecipazione?.progresso, 0);
}

export function getUnlockedMissionLevelOrder(currentLevel: MissioneLivello | null, hasCompletedSorting: boolean) {
	const currentLevelOrder = getLevelOrder(currentLevel);
	if (currentLevelOrder === null && hasCompletedSorting) return FIRST_MISSION_LEVEL_ORDER;
	if (currentLevelOrder === null) return null;

	return Math.max(currentLevelOrder, FIRST_MISSION_LEVEL_ORDER);
}

export function isMissioneVisibilePerLivello(
	missione: Missione,
	currentLevel: MissioneLivello | null,
	hasCompletedSorting: boolean,
) {
	if (missione.slug === TEST_SMISTAMENTO_SLUG) return false;

	const unlockedLevelOrder = getUnlockedMissionLevelOrder(currentLevel, hasCompletedSorting);
	const missionLevelOrder = getLevelOrder(missione.livello);

	if (unlockedLevelOrder === null || missionLevelOrder === null) return false;
	return missionLevelOrder <= unlockedLevelOrder;
}

export function sortMissioniByProgressionOrder(a: Missione, b: Missione) {
	const levelDiff = (getLevelOrder(a.livello) ?? 0) - (getLevelOrder(b.livello) ?? 0);
	if (levelDiff !== 0) return levelDiff;

	const orderA = normalizeOrder(a.ordine);
	const orderB = normalizeOrder(b.ordine);

	if (orderA === null && orderB !== null) return 1;
	if (orderA !== null && orderB === null) return -1;

	const missionDiff = (orderA ?? 0) - (orderB ?? 0);
	if (missionDiff !== 0) return missionDiff;

	return a.titolo.localeCompare(b.titolo, 'it-IT');
}

export function getPartecipazioniByMissione(partecipazioni: PartecipazioneMissione[]) {
	const partecipazioniByMissione = new Map<string, PartecipazioneMissione>();
	for (const partecipazione of partecipazioni) {
		const missioneSlug = partecipazione.missione?.slug;
		if (missioneSlug) partecipazioniByMissione.set(missioneSlug, partecipazione);
	}

	return partecipazioniByMissione;
}

export function toMissionCard(missione: Missione, partecipazione: PartecipazioneMissione | undefined): MissionCard {
	const progress = getMissionProgress(partecipazione);

	return {
		title: missione.titolo,
		description: getExcerpt(missione.descrizione),
		href: `/missioni/${missione.slug}/`,
		progress,
		meta: `${progress}%`,
	};
}

// §4.4: una missione con `missione_precedente` compilata non compare negli
// elenchi finche la missione referenziata non risulta completata (§4.1).
export function isMissionePrecedenteCompletata(
	missione: Missione,
	partecipazioniByMissione: Map<string, PartecipazioneMissione>,
	hasCompletedSorting: boolean,
) {
	const precedenteSlug = missione.missione_precedente?.slug?.trim();
	if (!precedenteSlug) return true;
	if (precedenteSlug === TEST_SMISTAMENTO_SLUG) return hasCompletedSorting;

	return partecipazioniByMissione.get(precedenteSlug)?.stato === 'completata';
}

export function getVisibleMissioni(
	missioni: Missione[],
	partecipazioni: PartecipazioneMissione[],
	currentLevel: MissioneLivello | null,
	hasCompletedSorting: boolean,
) {
	const partecipazioniByMissione = getPartecipazioniByMissione(partecipazioni);

	return missioni
		.filter((missione) => isMissioneVisibilePerLivello(missione, currentLevel, hasCompletedSorting))
		.filter((missione) => isMissionePrecedenteCompletata(missione, partecipazioniByMissione, hasCompletedSorting))
		.sort(sortMissioniByProgressionOrder);
}

export function buildMissionTabs(
	missioni: Missione[],
	partecipazioni: PartecipazioneMissione[],
	currentLevel: MissioneLivello | null,
	hasCompletedSorting: boolean,
): MissionTab[] {
	const partecipazioniByMissione = getPartecipazioniByMissione(partecipazioni);
	const inCorso: MissionCard[] = [];
	const completate: MissionCard[] = [];
	const disponibili: MissionCard[] = [];

	for (const missione of getVisibleMissioni(missioni, partecipazioni, currentLevel, hasCompletedSorting)) {
		const partecipazione = partecipazioniByMissione.get(missione.slug);
		const missionCard = toMissionCard(missione, partecipazione);

		if (partecipazione?.stato === 'completata') {
			completate.push(missionCard);
			continue;
		}

		if (partecipazione?.stato === 'inCorso') {
			inCorso.push(missionCard);
			continue;
		}

		disponibili.push(missionCard);
	}

	return [
		{ id: 'disponibili', label: 'Disponibili', missions: disponibili },
		{ id: 'in-corso', label: 'In corso', missions: inCorso },
		{ id: 'completate', label: 'Completate', missions: completate },		
	];
}

export function getFirstIncompleteMissionCards(
	missioni: Missione[],
	partecipazioni: PartecipazioneMissione[],
	currentLevel: MissioneLivello | null,
	hasCompletedSorting: boolean,
	limit = 2,
) {
	const partecipazioniByMissione = getPartecipazioniByMissione(partecipazioni);

	return getVisibleMissioni(missioni, partecipazioni, currentLevel, hasCompletedSorting)
		.filter((missione) => partecipazioniByMissione.get(missione.slug)?.stato !== 'completata')
		.slice(0, limit)
		.map((missione) => toMissionCard(missione, partecipazioniByMissione.get(missione.slug)));
}
