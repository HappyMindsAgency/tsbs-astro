import avatar01 from '../assets/Avatar_01_tartaruga.svg';
import avatar02 from '../assets/Avatar_02_ampolla.svg';
import avatar03 from '../assets/Avatar_03_fantasma.svg';
import avatar04 from '../assets/Avatar_04_candela.svg';
import avatar05 from '../assets/Avatar_05_penna_calamaio.svg';
import avatar06 from '../assets/Avatar_06_pavone.svg';
import avatar07 from '../assets/Avatar_07_libro.svg';
import avatar08 from '../assets/Avatar_08_piccione.svg';
import avatar09 from '../assets/Avatar_09_gatto1.svg';
import avatar10 from '../assets/Avatar_10_gatto2.svg';
import avatar11 from '../assets/Avatar_11_gatto3.svg';
import avatar12 from '../assets/Avatar_12_gatto4.svg';

const AVATAR_SRC_MAP: Record<string, string> = {
	'avatar-1': avatar01.src,
	'avatar-2': avatar02.src,
	'avatar-3': avatar03.src,
	'avatar-4': avatar04.src,
	'avatar-5': avatar05.src,
	'avatar-6': avatar06.src,
	'avatar-7': avatar07.src,
	'avatar-8': avatar08.src,
	'avatar-9': avatar09.src,
	'avatar-10': avatar10.src,
	'avatar-11': avatar11.src,
	'avatar-12': avatar12.src,
};

export function resolveAvatarSrc(avatarId: unknown): string | null {
	if (typeof avatarId !== 'string') return null;
	return AVATAR_SRC_MAP[avatarId] ?? null;
}
