import { fetchStrapi } from './client';

type StrapiSingleResponse<T> = {
	data?: T | T[] | null;
	error?: {
		message?: string;
		status?: number;
	};
};

type StrapiPolicyPage = {
	id: number;
	documentId?: string;
	contenuto?: unknown;
};

export type PolicyPageContent = {
	content: string;
};

export type PolicyType = 'privacy' | 'cookie';

const STRAPI_LOCALE_BY_LANG: Record<string, string> = {
	it: 'it-IT',
};

const POLICY_ENDPOINT_BY_TYPE: Record<PolicyType, string> = {
	privacy: '/privacy-policy',
	cookie: '/pagina-cookie-policy',
};

function getItalianStrapiLocale(lang = 'it') {
	return STRAPI_LOCALE_BY_LANG[lang] || STRAPI_LOCALE_BY_LANG.it;
}

function getSingleData<T>(data?: T | T[] | null) {
	return Array.isArray(data) ? data[0] || null : data || null;
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

export async function getPolicyPage(type: PolicyType, lang = 'it'): Promise<PolicyPageContent | null> {
	const searchParams = new URLSearchParams();
	searchParams.set('locale', getItalianStrapiLocale(lang));
	searchParams.set('status', 'published');
	searchParams.set('fields[0]', 'contenuto');

	try {
		const response = await fetchStrapi<StrapiSingleResponse<StrapiPolicyPage>>(POLICY_ENDPOINT_BY_TYPE[type], searchParams);
		const policyPage = getSingleData(response.data);
		const content = toRichTextContent(policyPage?.contenuto);

		return content ? { content } : null;
	} catch {
		return null;
	}
}
