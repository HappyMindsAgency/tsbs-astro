const FAVORITES_STORAGE_KEY = 'tsbs.profileFavorites.v1';

const normalizeProfileIds = (value) => {
	if (!Array.isArray(value)) return [];

	return [...new Set(value.filter((item) => typeof item === 'string' && item.trim().length > 0))];
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getFavorites = () => {
	if (!canUseStorage()) return [];

	try {
		return normalizeProfileIds(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]'));
	} catch {
		return [];
	}
};

const setFavorites = (profileIds) => {
	const favorites = normalizeProfileIds(profileIds);

	if (canUseStorage()) {
		window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
		window.dispatchEvent(new CustomEvent('tsbs:profile-favorites-change', { detail: { favorites } }));
	}

	return favorites;
};

export const isFavorite = (profileId) => getFavorites().includes(profileId);

export const addFavorite = (profileId) => setFavorites([...getFavorites(), profileId]);

export const removeFavorite = (profileId) => setFavorites(getFavorites().filter((favoriteId) => favoriteId !== profileId));

export const toggleFavorite = (profileId) => (isFavorite(profileId) ? removeFavorite(profileId) : addFavorite(profileId));

// Strapi TODO: mantenere questa API pubblica e sostituire solo l'implementazione interna.
// In produzione lo storage locale dovra diventare una relazione Strapi tra utente autenticato e profili preferiti.
// La UI deve continuare a salvare solo identificativi stabili, non copie complete dei profili.
