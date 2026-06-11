import { fetchStrapi } from './client';

type StrapiSingleResponse<T> = {
	data?: T | T[] | null;
	error?: {
		message?: string;
		status?: number;
	};
};

type StrapiFaqComponent = {
	id?: number;
	domanda?: unknown;
	risposta?: unknown;
	question?: unknown;
	answer?: unknown;
	titolo?: unknown;
	testo?: unknown;
	contenuto?: unknown;
};

type StrapiFaqPage = {
	id: number;
	documentId?: string;
	contenuto?: unknown;
	faq?: StrapiFaqComponent[] | null;
};

export type FaqItem = {
	id: string;
	question: string;
	answer: string;
};

export type FaqPageContent = {
	introContent: string;
	items: FaqItem[];
};

const STRAPI_LOCALE_BY_LANG: Record<string, string> = {
	it: 'it-IT',
};

function getItalianStrapiLocale(lang = 'it') {
	return STRAPI_LOCALE_BY_LANG[lang] || STRAPI_LOCALE_BY_LANG.it;
}

function toPlainText(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean).join('\n').trim();

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;

		if (typeof record.text === 'string') return record.text.trim();
		if (typeof record.value === 'string') return record.value.trim();
		if (Array.isArray(record.children)) return toPlainText(record.children);
	}

	return '';
}

function getSingleData<T>(data?: T | T[] | null) {
	return Array.isArray(data) ? data[0] || null : data || null;
}

function normalizeFaqItem(item: StrapiFaqComponent, index: number): FaqItem | null {
	const question = toPlainText(item.domanda ?? item.question ?? item.titolo);
	const answer = toRichTextContent(item.risposta ?? item.answer ?? item.testo ?? item.contenuto);

	if (!question || !answer) return null;

	return {
		id: `faq-strapi-${item.id ?? index}`,
		question,
		answer,
	};
}

function toRichTextContent(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.map(toRichTextContent).filter(Boolean).join('\n\n').trim();

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;

		if (typeof record.text === 'string') return record.text.trim();
		if (typeof record.value === 'string') return record.value.trim();
		if (Array.isArray(record.children)) return toRichTextContent(record.children);
	}

	return '';
}

export async function getFaqPage(lang = 'it'): Promise<FaqPageContent | null> {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('fields[0]', 'contenuto');
	searchParams.set('populate[faq]', 'true');

	try {
		const response = await fetchStrapi<StrapiSingleResponse<StrapiFaqPage>>('/faq', searchParams);
		const faqPage = getSingleData(response.data);

		if (!faqPage) return null;

		const introContent = toRichTextContent(faqPage.contenuto);
		const items = (Array.isArray(faqPage.faq) ? faqPage.faq : [])
			.map(normalizeFaqItem)
			.filter((item): item is FaqItem => Boolean(item));

		if (!introContent && items.length === 0) return null;

		return { introContent, items };
	} catch {
		return null;
	}
}
