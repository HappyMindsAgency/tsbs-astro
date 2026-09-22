// Logica server-side della Missione 6 - Sfida di lettura (365 giorni).
// Regole: un solo inserimento al giorno (mezzanotte Europe/Rome), +1 punto per
// libro riconosciuto, trofei idempotenti alle soglie 4/6/12/20 libri.
// Da usare solo nelle route API / pagine server Astro.

import { getStrapiApiUrl } from './api-url';
import {
	aggiungiPuntiMembro,
	assegnaTrofeoSeNuovo,
	getTodayRome,
	registraEsitoProva,
	withLock,
	type MembroProgressione,
	type MissioneProgressione,
	type TrofeoSbloccato,
} from './progressione';
import { resolveStrapiMediaUrl } from './trofei';
import { logger } from '../../services/logger';

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;

// Numero di estratti proposti a ogni tentativo: 1 del libro scelto + 3 distrattori.
const ESTRATTI_PER_TENTATIVO = 4;
const OBIETTIVO_LETTURE = 20;

// Mappatura soglia -> trofeo: i 4 trofei della sfida sono identificati dal
// codice nel nome ("06a".."06d") e dall'Accademia del Membro (vedi decision log).
const SOGLIE_TROFEI: Array<{ codice: string; soglia: number | 'tutti' }> = [
	{ codice: '06a', soglia: 4 },
	{ codice: '06b', soglia: 6 },
	{ codice: '06c', soglia: 12 },
	{ codice: '06d', soglia: 20 },
];

export type LibroSfida = {
	id: number;
	documentId: string;
	titolo: string;
	autore: string | null;
	genere: string | null;
	estratto: string | null;
};

export type TentativoLetturaRecord = {
	id: number;
	documentId: string;
	dataUltimoTentativo: string | null;
	rispostaDomanda: boolean | null;
	storicoTentativi: unknown;
	libro: { documentId: string; titolo?: string } | null;
};

export type StatoSfidaLettura = {
	libri: LibroSfida[];
	libriRiconosciuti: string[]; // documentId dei libri gia riconosciuti
	tentativoOdiernoEffettuato: boolean;
};

function adminHeaders() {
	return { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// La lista chiusa della sfida: tutti i Libri pubblicati con un estratto utile.
export async function getLibriSfida(): Promise<LibroSfida[]> {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'autore');
	searchParams.set('fields[2]', 'genere');
	searchParams.set('fields[3]', 'estratto');
	searchParams.set('sort[0]', 'titolo:asc');
	searchParams.set('pagination[pageSize]', '200');

	const response = await fetch(`${STRAPI_API_BASE_URL}/libri?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return [];

	const payload = await response.json();
	const libri = (payload?.data ?? []) as LibroSfida[];
	return libri.filter((libro) => Boolean(libro.estratto?.trim()));
}

export async function getTentativiLetturaByMembro(membroDocumentId: string): Promise<TentativoLetturaRecord[]> {
	const searchParams = new URLSearchParams();
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('fields[0]', 'dataUltimoTentativo');
	searchParams.set('fields[1]', 'rispostaDomanda');
	searchParams.set('fields[2]', 'storicoTentativi');
	searchParams.set('populate[libro][fields][0]', 'titolo');
	searchParams.set('pagination[pageSize]', '200');

	const response = await fetch(`${STRAPI_API_BASE_URL}/tentativi-lettura?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return [];

	const payload = await response.json();
	return (payload?.data ?? []) as TentativoLetturaRecord[];
}

// "Inserimento" = risposta data: la sola apertura della domanda non consuma il
// tentativo giornaliero.
export function haTentativoOdierno(tentativi: TentativoLetturaRecord[]): boolean {
	const today = getTodayRome();
	return tentativi.some((record) => (record.dataUltimoTentativo ?? '').slice(0, 10) === today);
}

export function getLibriRiconosciuti(tentativi: TentativoLetturaRecord[]): string[] {
	return tentativi
		.filter((record) => record.rispostaDomanda === true && record.libro?.documentId)
		.map((record) => record.libro!.documentId);
}

export async function getStatoSfidaLettura(membroDocumentId: string): Promise<StatoSfidaLettura> {
	const [libri, tentativi] = await Promise.all([
		getLibriSfida(),
		getTentativiLetturaByMembro(membroDocumentId),
	]);

	return {
		libri,
		libriRiconosciuti: getLibriRiconosciuti(tentativi),
		tentativoOdiernoEffettuato: haTentativoOdierno(tentativi),
	};
}

type PropostaCorrente = {
	data: string;
	// documentId dei libri nell'ordine (mescolato) in cui gli estratti sono proposti.
	estratti: Array<{ libroDocumentId: string; estratto: string }>;
};

function leggiStorico(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function leggiPropostaCorrente(storico: Record<string, unknown>): PropostaCorrente | null {
	const proposta = storico.propostaCorrente;
	if (!isRecord(proposta) || !Array.isArray(proposta.estratti)) return null;
	return proposta as unknown as PropostaCorrente;
}

function shuffle<T>(items: T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

async function getTentativoLetturaRecord(membroDocumentId: string, libroDocumentId: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('filters[libro][documentId][$eq]', libroDocumentId);
	searchParams.set('fields[0]', 'dataUltimoTentativo');
	searchParams.set('fields[1]', 'rispostaDomanda');
	searchParams.set('fields[2]', 'storicoTentativi');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetch(`${STRAPI_API_BASE_URL}/tentativi-lettura?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return null;

	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as TentativoLetturaRecord | null;
}

async function salvaTentativoLettura(
	membroDocumentId: string,
	libroDocumentId: string,
	existingDocumentId: string | null,
	data: Record<string, unknown>,
) {
	const response = existingDocumentId
		? await fetch(`${STRAPI_API_BASE_URL}/tentativi-lettura/${existingDocumentId}`, {
			method: 'PUT',
			headers: adminHeaders(),
			body: JSON.stringify({ data }),
		})
		: await fetch(`${STRAPI_API_BASE_URL}/tentativi-lettura`, {
			method: 'POST',
			headers: adminHeaders(),
			body: JSON.stringify({
				data: {
					...data,
					membro: { connect: [membroDocumentId] },
					libro: { connect: [libroDocumentId] },
				},
			}),
		});

	if (!response.ok) {
		logger.error(`[Sfida Lettura] Salvataggio tentativo-lettura fallito: ${await response.text()}`);
		return null;
	}

	const payload = await response.json();
	return (payload?.data ?? null) as TentativoLetturaRecord | null;
}

export type DomandaSfida = {
	estratti: string[]; // solo i testi, in ordine mescolato: l'indice corretto resta sul server
};

// Genera la rosa di 4 estratti (1 del libro scelto + 3 distrattori casuali) e
// la persiste come proposta corrente: la validazione resta cosi server-side.
export async function generaDomandaSfida(
	membro: MembroProgressione,
	libroDocumentId: string,
): Promise<{ domanda?: DomandaSfida; errore?: string }> {
	// Lock per membro (non per libro): il limite e' un solo tentativo al
	// giorno sull'intera sfida, quindi il check-poi-scrittura va serializzato
	// per membro cosi' due richieste concorrenti non superano entrambe il
	// controllo "tentativo_gia_effettuato_oggi" prima che una delle due salvi.
	return withLock(`sfida-lettura:${membro.documentId}`, async () => {
		const [libri, tentativi] = await Promise.all([
			getLibriSfida(),
			getTentativiLetturaByMembro(membro.documentId),
		]);

		const libroScelto = libri.find((libro) => libro.documentId === libroDocumentId);
		if (!libroScelto) return { errore: 'libro_non_valido' };

		if (getLibriRiconosciuti(tentativi).includes(libroDocumentId)) {
			return { errore: 'libro_gia_riconosciuto' };
		}

		if (haTentativoOdierno(tentativi)) {
			return { errore: 'tentativo_gia_effettuato_oggi' };
		}

		const distrattori = shuffle(libri.filter((libro) => libro.documentId !== libroDocumentId))
			.slice(0, ESTRATTI_PER_TENTATIVO - 1);

		if (distrattori.length < ESTRATTI_PER_TENTATIVO - 1) {
			return { errore: 'estratti_insufficienti' };
		}

		const estratti = shuffle([
			{ libroDocumentId: libroScelto.documentId, estratto: libroScelto.estratto!.trim() },
			...distrattori.map((libro) => ({ libroDocumentId: libro.documentId, estratto: libro.estratto!.trim() })),
		]);

		const existing = await getTentativoLetturaRecord(membro.documentId, libroDocumentId);
		const storico = leggiStorico(existing?.storicoTentativi);
		const saved = await salvaTentativoLettura(membro.documentId, libroDocumentId, existing?.documentId ?? null, {
			storicoTentativi: {
				...storico,
				propostaCorrente: { data: getTodayRome(), estratti } satisfies PropostaCorrente,
			},
		});

		if (!saved) return { errore: 'salvataggio_fallito' };

		return { domanda: { estratti: estratti.map((item) => item.estratto) } };
	});
}

export type EsitoRispostaSfida = {
	corretta: boolean;
	libriRiconosciuti: number;
	totaleLibri: number;
	puntiAssegnati: number;
	trofeiSbloccati: TrofeoSbloccato[];
};

// Valida la risposta del giorno: registra il tentativo, assegna il punto del
// libro e verifica le soglie trofeo (tutto idempotente).
export async function rispondiDomandaSfida(
	membro: MembroProgressione,
	missione: MissioneProgressione,
	libroDocumentId: string,
	indiceScelto: number,
	missioneGiaCompletata = false,
): Promise<{ esito?: EsitoRispostaSfida; errore?: string }> {
	// Stessa chiave di lock di generaDomandaSfida: check "un tentativo al
	// giorno" e scrittura devono essere atomici rispetto a qualsiasi altra
	// richiesta concorrente dello stesso membro sulla sfida.
	return withLock(`sfida-lettura:${membro.documentId}`, async () => {
		const existing = await getTentativoLetturaRecord(membro.documentId, libroDocumentId);
		const storico = leggiStorico(existing?.storicoTentativi);
		const proposta = leggiPropostaCorrente(storico);
		const today = getTodayRome();

		if (!existing || !proposta || proposta.data !== today) {
			return { errore: 'proposta_non_valida' };
		}

		const tentativi = await getTentativiLetturaByMembro(membro.documentId);
		if (haTentativoOdierno(tentativi)) {
			return { errore: 'tentativo_gia_effettuato_oggi' };
		}

		const estrattoScelto = proposta.estratti[indiceScelto];
		if (!estrattoScelto) return { errore: 'risposta_non_valida' };

		const corretta = estrattoScelto.libroDocumentId === libroDocumentId;

		// Storico in formato consigliato: array `tentativi` con date ISO.
		const storicoTentativi = Array.isArray(storico.tentativi) ? storico.tentativi : [];
		const saved = await salvaTentativoLettura(membro.documentId, libroDocumentId, existing.documentId, {
			dataUltimoTentativo: today,
			rispostaDomanda: corretta,
			storicoTentativi: {
				...storico,
				propostaCorrente: null,
				tentativi: [...storicoTentativi, {
					dataTentativo: today,
					estrattiProposti: proposta.estratti.map((item) => item.libroDocumentId),
					indiceScelto,
					rispostaDomanda: corretta,
				}],
			},
		});

		if (!saved) return { errore: 'salvataggio_fallito' };

		const libri = await getLibriSfida();
		const totaleLibri = libri.length;
		const libriRiconosciuti = getLibriRiconosciuti(await getTentativiLetturaByMembro(membro.documentId)).length;

		const esito: EsitoRispostaSfida = {
			corretta,
			libriRiconosciuti,
			totaleLibri,
			puntiAssegnati: 0,
			trofeiSbloccati: [],
		};

		if (!corretta) {
			// Aggiorna comunque la partecipazione (stato inCorso e storico tentativi).
			if (!missioneGiaCompletata) {
				await registraEsitoProva({
					membro,
					missione,
					esito: false,
					progresso: Math.min(100, Math.round((libriRiconosciuti / OBIETTIVO_LETTURE) * 100)),
				});
			}
			return { esito };
		}

		// +1 punto per ogni libro riconosciuto correttamente.
		if (await aggiungiPuntiMembro(membro.documentId, 1)) {
			esito.puntiAssegnati = 1;
		}

		// Trofei alle soglie raggiunte (idempotenti: assegnati una sola volta).
		esito.trofeiSbloccati = await assegnaTrofeiSoglia(membro, libriRiconosciuti, totaleLibri);

		// La missione si completa alla ventesima lettura, ma la sfida resta attiva:
		// le letture successive continuano ad assegnare il punto giornaliero.
		const obiettivoRaggiunto = libriRiconosciuti >= OBIETTIVO_LETTURE;
		const progressione = missioneGiaCompletata
			? null
			: await registraEsitoProva({
				membro,
				missione,
				esito: obiettivoRaggiunto,
				progresso: Math.min(100, Math.round((libriRiconosciuti / OBIETTIVO_LETTURE) * 100)),
			});

		if (progressione) {
			esito.puntiAssegnati += progressione.puntiAssegnati;
			esito.trofeiSbloccati = [...esito.trofeiSbloccati, ...progressione.trofeiSbloccati];
		}

		return { esito };
	});
}

// Risolve e assegna i trofei soglia per l'Accademia del Membro: il criterio di
// mappatura e il codice "06a..06d" + nome Accademia contenuti in Trofeo.nome.
// Firma ridotta a Pick<MembroProgressione> (non il tipo completo) cosi' puo'
// essere chiamata anche dal backfill, che non ha punti/livello/email a disposizione.
export async function assegnaTrofeiSoglia(
	membro: Pick<MembroProgressione, 'documentId' | 'accademia'>,
	libriRiconosciuti: number,
	totaleLibri: number,
): Promise<TrofeoSbloccato[]> {
	const accademiaNome = membro.accademia?.nome?.trim() || membro.accademia?.slug?.trim();
	if (!accademiaNome) {
		logger.warn(`[Sfida Lettura] Membro ${membro.documentId} senza Accademia: trofei soglia non assegnabili`);
		return [];
	}

	const sbloccati: TrofeoSbloccato[] = [];

	for (const { codice, soglia } of SOGLIE_TROFEI) {
		const valoreSoglia = soglia === 'tutti' ? totaleLibri : soglia;
		if (valoreSoglia <= 0 || libriRiconosciuti < valoreSoglia) continue;

		const trofeo = await trovaTrofeoSoglia(codice, accademiaNome);
		if (!trofeo) {
			logger.warn(`[Sfida Lettura] Trofeo soglia ${codice} non trovato per Accademia ${accademiaNome}`);
			continue;
		}

		const nuovo = await assegnaTrofeoSeNuovo(membro.documentId, trofeo.documentId);
		if (nuovo) {
			sbloccati.push(trofeo);
			if (trofeo.punti) await aggiungiPuntiMembro(membro.documentId, trofeo.punti);
		}
	}

	return sbloccati;
}

type TrofeoSogliaView = TrofeoSbloccato & { punti: number | null };

async function trovaTrofeoSoglia(codice: string, accademiaNome: string): Promise<TrofeoSogliaView | null> {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('filters[nome][$containsi]', codice);
	searchParams.set('fields[0]', 'nome');
	searchParams.set('fields[1]', 'descrizione');
	searchParams.set('fields[2]', 'punti');
	searchParams.set('populate[immagine][fields][0]', 'url');
	searchParams.set('pagination[pageSize]', '10');

	const response = await fetch(`${STRAPI_API_BASE_URL}/trofei?${searchParams}`, { headers: adminHeaders() });
	if (!response.ok) return null;

	const payload = await response.json();
	const candidati = (payload?.data ?? []) as Array<{
		documentId: string;
		nome: string;
		descrizione: string | null;
		punti: number | null;
		immagine: { url: string | null } | null;
	}>;

	const match = candidati.find((trofeo) => trofeo.nome.toLocaleLowerCase('it-IT').includes(accademiaNome.toLocaleLowerCase('it-IT')));
	if (!match) return null;

	return {
		documentId: match.documentId,
		nome: match.nome,
		descrizione: match.descrizione,
		immagineUrl: resolveStrapiMediaUrl(match.immagine?.url),
		punti: match.punti,
	};
}

type MembroAccademiaLite = {
	documentId: string;
	accademia: { documentId: string; slug: string | null; nome: string | null } | null;
};

// Rilegge tutti i tentativi-lettura con risposta corretta, li raggruppa per
// membro e ri-applica assegnaTrofeiSoglia: idempotente (assegnaTrofeoSeNuovo
// salta chi ha gia' il trofeo), quindi va bene anche su chi e' gia' a posto.
// Recupera i trofei soglia persi per la race condition di rispondiDomandaSfida
// prima dell'introduzione del lock per-membro (vedi decision-log).
async function getTuttiTentativiLetturaCorretti(): Promise<Array<{ membro: MembroAccademiaLite | null }>> {
	const pageSize = 100;
	const risultati: Array<{ membro: MembroAccademiaLite | null }> = [];
	let page = 1;

	// ponytail: while(true) con break su pagina corta, non serve una libreria
	// di paginazione per un giro di backfill una tantum.
	while (true) {
		const searchParams = new URLSearchParams();
		searchParams.set('filters[rispostaDomanda][$eq]', 'true');
		searchParams.set('fields[0]', 'rispostaDomanda');
		searchParams.set('populate[membro][fields][0]', 'documentId');
		searchParams.set('populate[membro][populate][accademia][fields][0]', 'slug');
		searchParams.set('populate[membro][populate][accademia][fields][1]', 'nome');
		searchParams.set('pagination[page]', String(page));
		searchParams.set('pagination[pageSize]', String(pageSize));

		const response = await fetch(`${STRAPI_API_BASE_URL}/tentativi-lettura?${searchParams}`, { headers: adminHeaders() });
		if (!response.ok) break;

		const payload = await response.json();
		const data = (payload?.data ?? []) as Array<{ membro: MembroAccademiaLite | null }>;
		risultati.push(...data);

		if (data.length < pageSize) break;
		page += 1;
	}

	return risultati;
}

export type BackfillTrofeiSogliaResult = {
	membriControllati: number;
	trofeiAssegnati: Array<{ membroDocumentId: string; trofeo: TrofeoSbloccato }>;
};

// Recupero una tantum dei trofei soglia (4/6/12/20) non assegnati a causa
// della race condition risolta in rispondiDomandaSfida. Sicura da rilanciare
// piu' volte: ogni assegnazione passa comunque da assegnaTrofeoSeNuovo.
export async function backfillTrofeiSogliaSfidaLettura(): Promise<BackfillTrofeiSogliaResult> {
	const [tentativi, libri] = await Promise.all([getTuttiTentativiLetturaCorretti(), getLibriSfida()]);
	const totaleLibri = libri.length;

	const conteggiPerMembro = new Map<string, { membro: MembroAccademiaLite; count: number }>();
	for (const { membro } of tentativi) {
		if (!membro?.documentId) continue;
		const voce = conteggiPerMembro.get(membro.documentId) ?? { membro, count: 0 };
		voce.count += 1;
		conteggiPerMembro.set(membro.documentId, voce);
	}

	const sogliaMinima = Math.min(...SOGLIE_TROFEI.map((s) => (s.soglia === 'tutti' ? totaleLibri : s.soglia)));
	const trofeiAssegnati: BackfillTrofeiSogliaResult['trofeiAssegnati'] = [];
	let membriControllati = 0;

	for (const { membro, count } of conteggiPerMembro.values()) {
		if (count < sogliaMinima) continue;
		membriControllati += 1;

		const sbloccati = await assegnaTrofeiSoglia(membro, count, totaleLibri);
		for (const trofeo of sbloccati) {
			trofeiAssegnati.push({ membroDocumentId: membro.documentId, trofeo });
		}
	}

	return { membriControllati, trofeiAssegnati };
}
