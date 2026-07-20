// Wrapper resiliente per le chiamate a Strapi dalle route server-side.
// Strapi gira su Render con spin-down: la prima richiesta dopo un periodo di
// idle può fallire (cold-start: 5xx/timeout). Su Vercel la function serverless
// ha un timeout più corto del cold-start, quindi una scrittura può essere
// abortita a metà. Qui: timeout breve per fallire in fretta + retry con backoff
// su errore di rete / 5xx / 429 (il 1° tentativo sveglia Strapi, il retry va a
// segno quando è su). I 4xx NON vengono ritentati: sono errori veri (payload).

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 8000;

function backoffMs(attemptIndex: number): number {
	// 250ms, 500ms, 1000ms, ... — sufficiente a coprire il risveglio di Render
	// senza sforare il maxDuration della function.
	return 250 * 2 ** attemptIndex;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchStrapiWithRetry(
	url: string,
	init: RequestInit = {},
	opts: { attempts?: number; timeoutMs?: number } = {},
): Promise<Response> {
	const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
	const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	let lastError: unknown;

	for (let i = 0; i < attempts; i += 1) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, { ...init, signal: controller.signal });
			clearTimeout(timer);

			// Ritenta solo su errori transitori lato server (cold-start/rate limit).
			if ((response.status >= 500 || response.status === 429) && i < attempts - 1) {
				await sleep(backoffMs(i));
				continue;
			}

			return response;
		} catch (error) {
			clearTimeout(timer);
			lastError = error;

			// Errore di rete o abort per timeout: ritenta finché restano tentativi.
			if (i < attempts - 1) {
				await sleep(backoffMs(i));
				continue;
			}

			throw error;
		}
	}

	// Irraggiungibile: il loop o ritorna una Response o lancia all'ultimo tentativo.
	throw lastError ?? new Error('fetchStrapiWithRetry: nessun tentativo eseguito');
}
