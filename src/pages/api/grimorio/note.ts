import type { APIRoute } from 'astro';
import { getStrapiApiUrl } from '../../../lib/strapi/api-url';
import { sendNotification } from '../../../lib/mailer';
import { logger } from '../../../services/logger';

type StrapiRecord = {
	id: number;
	documentId: string;
};

type MembroRecord = StrapiRecord & {
	email?: string | null;
	nickname?: string | null;
	accademia?: StrapiRecord | null;
};

type MissioneRecord = StrapiRecord & {
	titolo?: string | null;
	slug?: string | null;
};

type GrimorioPayload = {
	title?: string;
	body?: string;
	action?: 'draft' | 'submit';
	missioneSlug?: string;
	noteDocumentId?: string;
};

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;
const EMAIL_REDAZIONE = import.meta.env.EMAIL_REDAZIONE ?? 'assistenzaweb@happyminds.it';

export const POST: APIRoute = async ({ request, cookies }) => {
	const jwt = cookies.get('jwt')?.value;

	if (!jwt) {
		return json({ error: 'unauthorized' }, 401);
	}

	if (!STRAPI_API) {
		return json({ error: 'missing_strapi_token' }, 500);
	}

	let body: GrimorioPayload;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body' }, 400);
	}

	const title = normalizeTitle(body.title);
	const noteBody = typeof body.body === 'string' ? body.body.trim() : '';
	const plainBody = toPlainText(noteBody);
	const action = body.action === 'submit' ? 'submit' : 'draft';
	const missioneSlug = typeof body.missioneSlug === 'string' ? body.missioneSlug.trim() : '';
	const noteDocumentId = typeof body.noteDocumentId === 'string' ? body.noteDocumentId.trim() : '';

	if (!plainBody) {
		return json({ error: 'empty_note', message: 'Scrivi una nota prima di salvarla.' }, 400);
	}

	const user = await getCurrentUser(jwt);
	if (!user) {
		return json({ error: 'unauthorized' }, 401);
	}

	const membro = await getMembroByUserId(user.id);
	if (!membro) {
		return json({ error: 'membro_not_found' }, 404);
	}

	const note = noteDocumentId
		? await updateNota(noteDocumentId, membro.documentId, { title, body: noteBody })
		: await createNota(membro, { title, body: noteBody });

	if (!note) {
		return json({ error: 'note_save_failed', message: 'Salvataggio non riuscito.' }, 500);
	}

	let missionCompleted = false;
	if (missioneSlug) {
		const missione = await getMissioneBySlug(missioneSlug);
		if (!missione) {
			return json({ error: 'mission_not_found' }, 404);
		}

		missionCompleted = await completeMissioneGrimorio(membro.documentId, missione, note.documentId, action);
		if (!missionCompleted) {
			return json({ error: 'mission_completion_failed', message: 'Nota salvata, ma completamento missione non riuscito.' }, 500);
		}
	}

	if (action === 'submit') {
		await notifyPrefetti({ user, membro, note, title, missioneSlug });
	}

	return json({
		success: true,
		noteDocumentId: note.documentId,
		missionCompleted,
		action,
	});
};

async function getCurrentUser(jwt: string) {
	const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
		headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
	});

	if (!userRes.ok) return null;
	return userRes.json() as Promise<{ id: number; email?: string; username?: string }>;
}

async function getMembroByUserId(userId: number) {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[user][id][$eq]', String(userId));
	searchParams.set('fields[0]', 'email');
	searchParams.set('fields[1]', 'nickname');
	searchParams.set('populate[accademia][fields][0]', 'nome');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, {
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
	});

	if (!response.ok) return null;
	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as MembroRecord | null;
}

async function getMissioneBySlug(slug: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', 'it-IT');
	searchParams.set('status', 'published');
	searchParams.set('filters[slug][$eq]', slug);
	searchParams.set('filters[attiva][$eq]', 'true');
	searchParams.set('fields[0]', 'titolo');
	searchParams.set('fields[1]', 'slug');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetch(`${STRAPI_API_BASE_URL}/missioni?${searchParams}`, {
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
	});

	if (!response.ok) return null;
	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as MissioneRecord | null;
}

async function createNota(membro: MembroRecord, nota: { title: string; body: string }) {
	const data: Record<string, unknown> = {
		titolo: nota.title,
		slug: buildNoteSlug(nota.title),
		contenuto: nota.body,
		visibilePubblico: false,
		membro: { connect: [membro.documentId] },
	};

	if (membro.accademia?.documentId) {
		data.accademia = { connect: [membro.accademia.documentId] };
	}

	const response = await fetch(`${STRAPI_API_BASE_URL}/grimori?status=published`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ data }),
	});

	if (!response.ok) {
		const error = await response.text();
		logger.error(`[Grimorio] Creazione nota fallita: ${error}`);
		return null;
	}

	const payload = await response.json();
	const documentId = payload?.data?.documentId;
	return documentId ? ({ documentId, id: payload.data.id } as StrapiRecord) : null;
}

async function updateNota(documentId: string, membroDocumentId: string, nota: { title: string; body: string }) {
	const existing = await getNotaForMembro(documentId, membroDocumentId);
	if (!existing) return null;

	const response = await fetch(`${STRAPI_API_BASE_URL}/grimori/${documentId}?status=published`, {
		method: 'PUT',
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			data: {
				titolo: nota.title,
				contenuto: nota.body,
				visibilePubblico: false,
			},
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		logger.error(`[Grimorio] Aggiornamento nota ${documentId} fallito: ${error}`);
		return null;
	}

	const payload = await response.json();
	const updatedDocumentId = payload?.data?.documentId ?? documentId;
	return { id: payload?.data?.id ?? existing.id, documentId: updatedDocumentId } as StrapiRecord;
}

async function getNotaForMembro(documentId: string, membroDocumentId: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'published');
	searchParams.set('filters[documentId][$eq]', documentId);
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('fields[0]', 'documentId');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetch(`${STRAPI_API_BASE_URL}/grimori?${searchParams}`, {
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
	});

	if (!response.ok) return null;
	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as StrapiRecord | null;
}

async function completeMissioneGrimorio(
	membroDocumentId: string,
	missione: MissioneRecord,
	noteDocumentId: string,
	action: 'draft' | 'submit',
) {
	const now = new Date().toISOString();
	const existing = await getPartecipazione(membroDocumentId, missione.documentId);
	const runtime = {
		grimorioDocumentId: noteDocumentId,
		azioneGrimorio: action,
		source: missione.slug,
	};

	if (existing) {
		const response = await fetch(`${STRAPI_API_BASE_URL}/partecipazioni-missione/${existing.documentId}`, {
			method: 'PUT',
			headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				data: {
					stato: 'completata',
					progresso: 100,
					dataCompletamento: existing.dataCompletamento || now,
					datiRuntime: {
						...(isRecord(existing.datiRuntime) ? existing.datiRuntime : {}),
						...runtime,
					},
				},
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			logger.error(`[Missione Grimorio] Aggiornamento partecipazione fallito: ${error}`);
		}

		return response.ok;
	}

	const response = await fetch(`${STRAPI_API_BASE_URL}/partecipazioni-missione`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			data: {
				stato: 'completata',
				progresso: 100,
				dataInizio: now,
				dataCompletamento: now,
				datiRuntime: runtime,
				membro: { connect: [membroDocumentId] },
				missione: { connect: [missione.documentId] },
			},
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		logger.error(`[Missione Grimorio] Creazione partecipazione fallita: ${error}`);
	}

	return response.ok;
}

async function getPartecipazione(membroDocumentId: string, missioneDocumentId: string) {
	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[membro][documentId][$eq]', membroDocumentId);
	searchParams.set('filters[missione][documentId][$eq]', missioneDocumentId);
	searchParams.set('fields[0]', 'stato');
	searchParams.set('fields[1]', 'progresso');
	searchParams.set('fields[2]', 'dataCompletamento');
	searchParams.set('fields[3]', 'datiRuntime');
	searchParams.set('pagination[pageSize]', '1');

	const response = await fetch(`${STRAPI_API_BASE_URL}/partecipazioni-missione?${searchParams}`, {
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
	});

	if (!response.ok) return null;
	const payload = await response.json();
	return (payload?.data?.[0] ?? null) as (StrapiRecord & {
		dataCompletamento?: string | null;
		datiRuntime?: unknown;
	}) | null;
}

async function notifyPrefetti(data: {
	user: { email?: string; username?: string };
	membro: MembroRecord;
	note: StrapiRecord;
	title: string;
	missioneSlug: string;
}) {
	try {
		await sendNotification({
			to: EMAIL_REDAZIONE,
			subject: 'Nuova nota proposta ai Prefetti - TSBS',
			html: `
				<h2 style="margin:0 0 1rem;font-size:1.25rem;">Nuova nota proposta ai Prefetti</h2>
				<p>Un membro ha inviato una nota del Grimorio alla valutazione.</p>
				<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:1.25rem 0;">
					<tr>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;width:40%;">Username</td>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(data.user.username ?? '—')}</td>
					</tr>
					<tr>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Email</td>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(data.user.email ?? data.membro.email ?? '—')}</td>
					</tr>
					<tr>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Titolo nota</td>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(data.title)}</td>
					</tr>
					<tr>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">ID nota Strapi</td>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-family:monospace;">${escapeHtml(data.note.documentId)}</td>
					</tr>
					<tr>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;font-weight:600;background:#f8f8f8;">Missione</td>
						<td style="padding:0.5rem 0.75rem;border:1px solid #e8e8e8;">${escapeHtml(data.missioneSlug || '—')}</td>
					</tr>
				</table>
				<p style="color:#555;">Accedi al pannello Strapi per valutare la nota e renderla pubblica solo se selezionata.</p>
			`,
		});
	} catch (error) {
		logger.error('[Grimorio] Invio email Prefetti fallito (nota salvata correttamente)', error);
	}
}

function normalizeTitle(value: unknown) {
	const title = typeof value === 'string' ? value.trim() : '';
	return title || 'Titolo della nota';
}

function toPlainText(value: string) {
	return value
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function buildNoteSlug(title: string) {
	const base = title
		.toLocaleLowerCase('it-IT')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60) || 'nota';

	return `${base}-${Date.now().toString(36)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		},
	});
}
