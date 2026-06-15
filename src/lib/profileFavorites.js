const normalizeProfileIds = (value) => {
	if (!Array.isArray(value)) return [];

	return [...new Set(value.filter((item) => typeof item === 'string' && item.trim().length > 0))];
};

const canUseApi = () => typeof window !== 'undefined' && typeof window.fetch === 'function';
let cachedFavorites = null;

const notifyFavoriteChange = (favorites) => {
	if (typeof window === 'undefined') return;

	window.dispatchEvent(new CustomEvent('tsbs:profile-favorites-change', { detail: { favorites } }));
};

const requestFavorites = async (method, profileId) => {
	if (!canUseApi()) return cachedFavorites ?? [];

	const response = await fetch('/api/user/preferiti', {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: profileId ? JSON.stringify({ profileId }) : undefined,
	});

	if (!response.ok) {
		throw new Error('favorite_request_failed');
	}

	const payload = await response.json();
	const favorites = normalizeProfileIds(payload.favoriteIds);
	cachedFavorites = favorites;
	notifyFavoriteChange(favorites);

	return favorites;
};

export const getFavorites = () => requestFavorites('GET');

export const isFavorite = async (profileId) => (await getFavorites()).includes(profileId);

export const addFavorite = (profileId) => requestFavorites('POST', profileId);

export const removeFavorite = (profileId) => requestFavorites('DELETE', profileId);

export const toggleFavorite = async (profileId) => {
	const favorites = cachedFavorites ?? (await getFavorites());
	return favorites.includes(profileId) ? removeFavorite(profileId) : addFavorite(profileId);
};
