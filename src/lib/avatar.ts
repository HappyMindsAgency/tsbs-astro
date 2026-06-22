// Avatar utente: versione .lottie animata (in loop) servita da /public/animation.
// L'id avatar è salvato nei datiAggiuntivi dell'utente (es. "avatar-1").
const AVATAR_LOTTIE_MAP: Record<string, string> = {
	'avatar-1': '/animation/Avatar_01_tartaruga.lottie',
	'avatar-2': '/animation/Avatar_02_ampolla.lottie',
	'avatar-3': '/animation/Avatar_03_fantasma.lottie',
	'avatar-4': '/animation/Avatar_04_candela.lottie',
	'avatar-5': '/animation/Avatar_05_penna_calamaio.lottie',
	'avatar-6': '/animation/Avatar_06_pavone.lottie',
	'avatar-7': '/animation/Avatar_07_libro.lottie',
	'avatar-8': '/animation/Avatar_08_piccione.lottie',
	'avatar-9': '/animation/Avatar_09_gatto1.lottie',
	'avatar-10': '/animation/Avatar_10_gatto2.lottie',
	'avatar-11': '/animation/Avatar_11_gatto3.lottie',
	'avatar-12': '/animation/Avatar_12_gatto4.lottie',
};

/** Numero di avatar disponibili (avatar-1 … avatar-N). */
export const AVATAR_COUNT = 12;

/** Path .lottie di un avatar dato il suo id ("avatar-N"), o null se sconosciuto. */
export function resolveAvatarLottie(avatarId: unknown): string | null {
	if (typeof avatarId !== 'string') return null;
	return AVATAR_LOTTIE_MAP[avatarId] ?? null;
}

/** Path .lottie dato l'indice 1-based. */
export function avatarLottieByNumber(n: number): string | null {
	return AVATAR_LOTTIE_MAP[`avatar-${n}`] ?? null;
}

/**
 * Sorgente dell'avatar usata in tutta l'app (ora un .lottie animato in loop).
 * Mantiene il nome storico per compatibilità con i consumer esistenti.
 */
export function resolveAvatarSrc(avatarId: unknown): string | null {
	return resolveAvatarLottie(avatarId);
}
