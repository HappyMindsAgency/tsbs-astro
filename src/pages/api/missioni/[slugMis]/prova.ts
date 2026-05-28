import type { APIRoute } from 'astro';
import { getMissioneBySlug } from '../../../../lib/strapi/missioni';
import { getStrapiApiUrl } from '../../../../lib/strapi/api-url';

type SubmittedAnswer = {
	questionIndex?: number;
	answer?: string;
};

const STRAPI_API_BASE_URL = getStrapiApiUrl();
const STRAPI_API = import.meta.env.AUTH_READONLY;
const LIBRARY_CARD_MISSION_SLUGS = new Set(['missione-01-il-varco']);
const LIBRARY_CARD_CODE_PATTERN = /^\d{14}$/;

export const POST: APIRoute = async ({ params, request, cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	const slugMis = params.slugMis;

	if (!jwt) {
		return json({ error: 'unauthorized' }, 401);
	}

	if (!slugMis) {
		return json({ error: 'missing_mission_slug' }, 400);
	}

	let body: { answers?: SubmittedAnswer[] };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body' }, 400);
	}

	if (!Array.isArray(body.answers)) {
		return json({ error: 'invalid_answers' }, 400);
	}

	const userRes = await fetch(`${STRAPI_API_BASE_URL}/users/me`, {
		headers: {
			Authorization: `Bearer ${jwt}`,
			'Content-Type': 'application/json',
		},
	});

	if (!userRes.ok) {
		return json({ error: 'unauthorized' }, 401);
	}
	const user = await userRes.json();

	const missione = await getMissioneBySlug(slugMis);
	const domande = missione?.quiz?.domande ?? [];

	if (!missione || domande.length === 0) {
		return json({ error: 'mission_quiz_not_found' }, 404);
	}

	if (body.answers.length !== domande.length) {
		return json({ error: 'answers_count_mismatch' }, 400);
	}

	const isLibraryCardMission = LIBRARY_CARD_MISSION_SLUGS.has(missione.slug);
	const libraryCardAnswer = isLibraryCardMission ? body.answers[0]?.answer ?? '' : '';
	const libraryCardCode = normalizeLibraryCardCode(libraryCardAnswer);

	if (isLibraryCardMission && !isValidLibraryCardCode(libraryCardCode)) {
		return json({ error: 'invalid_library_card_code' }, 400);
	}

	const results = domande.map((domanda, index) => {
		const submittedAnswer = body.answers?.find((item) => item.questionIndex === index);
		const value = submittedAnswer?.answer ?? '';
		const availableAnswers = domanda.risposte ?? [];
		const correctAnswers = availableAnswers.filter((risposta) => risposta.corretta === true);
		const acceptsAnyValidatedValue = isLibraryCardMission && correctAnswers.some((risposta) => !risposta.risposta?.trim());
		const acceptedAnswers = correctAnswers.length > 0 ? correctAnswers : availableAnswers.length === 1 ? availableAnswers : [];
		const normalizedValue = normalizeAnswer(value);
		const correct = acceptsAnyValidatedValue || acceptedAnswers.some((risposta) => normalizeAnswer(risposta.risposta ?? '') === normalizedValue);

		return { questionIndex: index, correct };
	});

	const correctCount = results.filter((result) => result.correct).length;
	const passed = correctCount === domande.length;

	if (isLibraryCardMission && passed) {
		const saved = await saveLibraryCardCode(user.id, libraryCardCode);
		if (!saved) {
			return json({ error: 'library_card_save_failed' }, 500);
		}
	}

	return json({
		success: true,
		passed,
		correctCount,
		total: domande.length,
	});
};

async function saveLibraryCardCode(userId: number, libraryCardCode: string) {
	if (!STRAPI_API) return false;

	const searchParams = new URLSearchParams();
	searchParams.set('status', 'draft');
	searchParams.set('filters[user][id][$eq]', String(userId));
	searchParams.set('fields[0]', 'documentId');
	searchParams.set('pagination[pageSize]', '1');

	const membroRes = await fetch(`${STRAPI_API_BASE_URL}/membri?${searchParams}`, {
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
	});

	if (!membroRes.ok) return false;

	const membroPayload = await membroRes.json();
	const membroDocumentId = membroPayload?.data?.[0]?.documentId;
	if (!membroDocumentId) return false;

	const updateRes = await fetch(`${STRAPI_API_BASE_URL}/membri/${membroDocumentId}`, {
		method: 'PUT',
		headers: { Authorization: `Bearer ${STRAPI_API}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ data: { tessera: libraryCardCode } }),
	});

	return updateRes.ok;
}

function normalizeLibraryCardCode(value: string) {
	return value.replace(/[\s-]+/g, '').trim();
}

function isValidLibraryCardCode(value: string) {
	return LIBRARY_CARD_CODE_PATTERN.test(value);
}

function normalizeAnswer(value: string) {
	return value
		.trim()
		.toLocaleLowerCase('it-IT')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
