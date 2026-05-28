import type { APIRoute } from 'astro';
import { getMissioneBySlug } from '../../../../lib/strapi/missioni';

type SubmittedAnswer = {
	questionIndex?: number;
	answer?: string;
};

const STRAPI_API_BASE_URL = import.meta.env.STRAPI_API_URL;

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

	const missione = await getMissioneBySlug(slugMis);
	const domande = missione?.quiz?.domande ?? [];

	if (!missione || domande.length === 0) {
		return json({ error: 'mission_quiz_not_found' }, 404);
	}

	if (body.answers.length !== domande.length) {
		return json({ error: 'answers_count_mismatch' }, 400);
	}

	const results = domande.map((domanda, index) => {
		const submittedAnswer = body.answers?.find((item) => item.questionIndex === index);
		const value = submittedAnswer?.answer ?? '';
		const availableAnswers = domanda.risposte ?? [];
		const correctAnswers = availableAnswers.filter((risposta) => risposta.corretta === true);
		const acceptedAnswers = correctAnswers.length > 0 ? correctAnswers : availableAnswers.length === 1 ? availableAnswers : [];
		const normalizedValue = normalizeAnswer(value);
		const correct = acceptedAnswers.some((risposta) => normalizeAnswer(risposta.risposta ?? '') === normalizedValue);

		return { questionIndex: index, correct };
	});

	const correctCount = results.filter((result) => result.correct).length;
	const passed = correctCount === domande.length;

	return json({
		success: true,
		passed,
		correctCount,
		total: domande.length,
	});
};

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
