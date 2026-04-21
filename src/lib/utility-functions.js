const MESI = [
    'GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU',
    'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'
];

export function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const giorno = date.getDate().toString().padStart(2, '0');
        const mese = MESI[date.getMonth()];
        const anno = date.getFullYear();

        return `${giorno} ${mese} ${anno}`;
    } catch {
        return dateString;
    }
}

export function getStrapiMediaUrl(mediaUrlString) {
    if (!mediaUrlString) return '';

    const mediaUrl = String(mediaUrlString).trim();

    if (/^https?:\/\//i.test(mediaUrl)) {
        return mediaUrl;
    }

    if (mediaUrl.startsWith('//')) {
        return `https:${mediaUrl}`;
    }

    const baseUrl = String(import.meta.env.STRAPI_URL || import.meta.env.STRAPI_API_URL || '').replace(/\/+$/, '');
    const normalizedPath = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;

    return `${baseUrl}${normalizedPath}`;
}

/**
 * Ottiene l'URL di un'immagine Strapi nel formato richiesto.
 * Evita di degradare fino alle thumbnail per le immagini di pagina.
 * @param {Object} image - L'oggetto media di Strapi
 * @param {string} requestedFormat - Il formato richiesto ('large', 'medium', 'small', 'thumbnail')
 * @returns {string} L'URL completo dell'immagine nel formato disponibile
 */
export function getImageFormat(image, requestedFormat) {
    if (!image) return '';

    if (!image.formats) {
        return getStrapiMediaUrl(image.url);
    }

    const fallbackChains = {
        large: ['large', 'medium'],
        medium: ['medium', 'large'],
        small: ['small', 'medium', 'large'],
        thumbnail: ['thumbnail', 'medium', 'large'],
    };

    const formatsToTry = fallbackChains[requestedFormat];

    if (!formatsToTry) {
        return getStrapiMediaUrl(image.url);
    }

    for (const formatName of formatsToTry) {
        if (image.formats[formatName]) {
            return getStrapiMediaUrl(image.formats[formatName].url);
        }
    }

    return getStrapiMediaUrl(image.url);
}
