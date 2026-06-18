// Catalogo condiviso delle forme "Tetris" dei trofei e logica per costruire,
// dai trofei conquistati, gli elementi da disporre sulla griglia.
// Usato dalla Stanza Trofei (editabile) e dalla vista profilo utente (sola lettura).

import trofeoBandiera from '../assets/trofeo-bandiera.png';
import trofeoCalice from '../assets/trofeo-calice.png';
import trofeoCandela from '../assets/trofeo-candela.png';
import trofeoChiave from '../assets/trofeo-chiave.png';
import trofeoMedaglia from '../assets/trofeo-medaglia.png';
import trofeoScudo from '../assets/trofeo-scudo.png';
import trofeoStendardo from '../assets/trofeo-stendardo.png';
import trofeoTartaruga from '../assets/trofeo-tartaruga.png';
import type { TrofeoConquistato } from './strapi/trofei';

// La matrice è l'unica fonte: larghezza/altezza si derivano da essa
// (1 = cella occupata, 0 = cella libera).
export type Forma =
	| 'punto'
	| 'barraOrizzontale'
	| 'barraOrizLunga'
	| 'barraVerticale'
	| 'barraVertLunga'
	| 'quadrato'
	| 'quadratoGrande'
	| 'elle'
	| 'coppa';

export const SHAPES: Record<Forma, number[][]> = {
	punto: [[1]],
	barraOrizzontale: [[1, 1]],
	barraOrizLunga: [[1, 1, 1, 1]],
	barraVerticale: [[1], [1]],
	barraVertLunga: [[1], [1], [1], [1]],
	quadrato: [
		[1, 1],
		[1, 1],
	],
	quadratoGrande: [
		[1, 1, 1],
		[1, 1, 1],
		[1, 1, 1],
	],
	elle: [
		[1, 0],
		[1, 0],
		[1, 1],
	],
	coppa: [
		[1, 1],
		[1, 0],
		[1, 1],
	],
};

// Forma usata quando un trofeo non ha `forma` valida su Strapi né mappatura per nome.
export const DEFAULT_FORMA: Forma = 'punto';

export function toForma(value: string | null | undefined): Forma | undefined {
	return value && value in SHAPES ? (value as Forma) : undefined;
}

// Fallback per i trofei storici privi del campo `forma` su Strapi: quale forma usa + immagine
// locale di fallback. Chiave = nome del trofeo normalizzato.
const TROPHIES: Record<string, { forma: Forma; fallbackSrc: string }> = {
	tartaruga: { forma: 'punto', fallbackSrc: trofeoTartaruga.src },
	scudo: { forma: 'punto', fallbackSrc: trofeoScudo.src },
	chiave: { forma: 'barraOrizzontale', fallbackSrc: trofeoChiave.src },
	calice: { forma: 'barraVerticale', fallbackSrc: trofeoCalice.src },
	medaglia: { forma: 'barraVerticale', fallbackSrc: trofeoMedaglia.src },
	stendardo: { forma: 'quadrato', fallbackSrc: trofeoStendardo.src },
	candela: { forma: 'elle', fallbackSrc: trofeoCandela.src },
	bandiera: { forma: 'coppa', fallbackSrc: trofeoBandiera.src },
};

export function normalizeTrophyKey(nome: string) {
	return nome
		.toLowerCase()
		.normalize('NFD')
		.replace(/[^a-z0-9]+/g, '');
}

// Elemento del catalogo trofei pronto per la griglia.
export type TrophyCatalogItem = {
	id: string;
	label: string;
	src: string;
	width: number;
	height: number;
	matrix: number[][];
	dataOttenimento: string | null;
};

// Mappa i trofei conquistati alla forma/dimensione attese dalla griglia.
// Priorità: `forma` da Strapi (se valida) -> mappatura storica per nome -> forma di default.
export function buildTrophyCatalog(trofei: TrofeoConquistato[]): TrophyCatalogItem[] {
	return trofei.map((trofeo) => {
		const known = TROPHIES[normalizeTrophyKey(trofeo.nome)];
		const forma = toForma(trofeo.forma) ?? known?.forma ?? DEFAULT_FORMA;
		const matrix = SHAPES[forma];

		return {
			id: trofeo.trofeoDocumentId,
			label: trofeo.nome,
			src: trofeo.immagineUrl ?? known?.fallbackSrc ?? '',
			width: matrix[0]?.length ?? 1,
			height: matrix.length || 1,
			matrix,
			dataOttenimento: trofeo.dataOttenimento,
		};
	});
}
