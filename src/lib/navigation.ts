const ALLOWED_RETURN_PATHS = new Set(['/atrio/', '/scrivania/', '/scrivania/grimorio/']);
const ALLOWED_ACADEMY_ROOM_PATH = /^\/sala-accademia-(astraria|arcadia|armonia|arborea)\/$/;

function normalizeInternalPath(value: string | null) {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return null;

	const path = value.split(/[?#]/)[0];
	const normalizedPath = path.endsWith('/') ? path : `${path}/`;

	return ALLOWED_RETURN_PATHS.has(normalizedPath) || ALLOWED_ACADEMY_ROOM_PATH.test(normalizedPath)
		? normalizedPath
		: null;
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
	if (ALLOWED_ACADEMY_ROOM_PATH.test(returnTo)) return 'Torna alla classifica';
	return fallback;
}
