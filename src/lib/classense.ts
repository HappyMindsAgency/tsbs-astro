/**
 * classense.ts — Integrazione REST API WordPress della Biblioteca Classense
 *
 * Punto unico per fetch, mappatura campi e configurazione.
 * Per cambiare endpoint, numero eventi o campi: modifica solo questa sezione.
 */

// ---------------------------------------------------------------------------
// CONFIGURAZIONE
// ---------------------------------------------------------------------------

/** Endpoint WordPress REST per gli eventi */
const CLASSENSE_EVENTI_URL =
    'https://www.classense.ra.it/wp-json/wp/v2/eventi?per_page=4&orderby=date&order=desc&_fields=title,link,yoast_head_json';

/** Immagine placeholder mostrata se og_image è assente o vuoto */
const CLASSENSE_PLACEHOLDER_IMAGE = '/placeholder-evento.svg';

/** URL della pagina calendario completo (link "Vedi tutti") */
export const CLASSENSE_CALENDARIO_URL = 'https://www.classense.ra.it/calendario-eventi/';

// ---------------------------------------------------------------------------
// TIPI
// ---------------------------------------------------------------------------

export type EventoClassense = {
    titolo: string;
    immagine: string;
    link: string;
};

// ---------------------------------------------------------------------------
// FETCH
// ---------------------------------------------------------------------------

/**
 * Recupera gli ultimi 4 eventi dalla Biblioteca Classense.
 * Restituisce un array vuoto in caso di errore (non rompe la pagina).
 */
export async function getEventiClassense(): Promise<EventoClassense[]> {
    try {
        const res = await fetch(CLASSENSE_EVENTI_URL, {
            // Timeout tramite AbortController: se l'API esterna è lenta
            // non blocca indefinitamente il rendering SSR
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return [];

        const raw = await res.json() as WordPressEvento[];

        return raw.map((item) => ({
            titolo: decodeHtmlEntities(item.title?.rendered ?? ''),
            immagine: item.yoast_head_json?.og_image?.[0]?.url || CLASSENSE_PLACEHOLDER_IMAGE,
            link: item.link ?? '',
        }));
    } catch {
        return [];
    }
}

// ---------------------------------------------------------------------------
// UTILITY
// ---------------------------------------------------------------------------

/**
 * Decodifica entità HTML presenti nei titoli WordPress
 * (es. &amp; → &, &#8220; → ", &#8221; → ", &#8230; → …)
 * Eseguita server-side: non ha accesso al DOM, usa una mappa esplicita.
 */
function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#8216;/g, '‘') // '
        .replace(/&#8217;/g, '’') // '
        .replace(/&#8220;/g, '“') // "
        .replace(/&#8221;/g, '”') // "
        .replace(/&#8230;/g, '…') // …
        .replace(/&#8211;/g, '–') // –
        .replace(/&#8212;/g, '—') // —
        // Catch-all per entità numeriche decimali non mappate sopra
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

// ---------------------------------------------------------------------------
// TIPI INTERNI (forma grezza della risposta WordPress)
// ---------------------------------------------------------------------------

type WordPressEvento = {
    title?: { rendered?: string };
    link?: string;
    yoast_head_json?: {
        og_image?: { url?: string }[];
    };
};
