const ALLOWED_RETURN_PATHS = new Set(['/atrio/', '/scrivania/', '/scrivania/grimorio/', '/classifica-generale/']);
const ALLOWED_ACADEMY_ROOM_PATH = /^\/sala-accademia-(astraria|arcadia|armonia|arborea)\/$/;

function normalizeInternalPath(value: string | null) {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return null;

	const [pathWithQuery] = value.split('#');
	const [path, queryString = ''] = pathWithQuery.split('?');
	const normalizedPath = path.endsWith('/') ? path : `${path}/`;

	if (normalizedPath === '/classifica-generale/' && queryString) {
		const params = new URLSearchParams(queryString);
		const nestedReturnTo = normalizeInternalPath(params.get('returnTo'));
		return nestedReturnTo ? `${normalizedPath}?returnTo=${encodeURIComponent(nestedReturnTo)}` : normalizedPath;
	}

	if (ALLOWED_RETURN_PATHS.has(normalizedPath) || ALLOWED_ACADEMY_ROOM_PATH.test(normalizedPath)) return normalizedPath;

	return null;
}

export function getSafeReturnTo(url: URL, fallback = '/scrivania/grimorio/') {
	return normalizeInternalPath(url.searchParams.get('returnTo')) ?? fallback;
}

export function withReturnTo(path: string, returnTo: string | null) {
	const safeReturnTo = normalizeInternalPath(returnTo);
	if (!safeReturnTo) return path;

	const separator = path.includes('?') ? '&' : '?';
	return `${path}${separator}returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function getReturnToLabel(returnTo: string, fallback = 'Torna al grimorio') {
	if (returnTo === '/atrio/') return "Torna all'Atrio";
	if (returnTo === '/scrivania/') return 'Torna alla scrivania';
	if (returnTo.startsWith('/classifica-generale/')) return 'Torna alla classifica';
	if (ALLOWED_ACADEMY_ROOM_PATH.test(returnTo)) return 'Torna alla classifica';
	return fallback;
}
