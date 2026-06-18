/**
 * Filtro "bad words" per gli username/nickname.
 *
 * Due livelli di severità, come da requisito:
 *  - ITALIANO → molto stringente: match per *sottostringa* sulla forma compatta
 *    del nickname (lowercase, accenti rimossi, leet-speak normalizzato, soli
 *    caratteri alfabetici). Così "M4r1o_str0nz0" viene comunque intercettato.
 *  - INGLESE → più blando: match solo se il nickname (o un suo "token" separato
 *    da caratteri non alfabetici) è *esattamente* una bad word. Evita il
 *    problema Scunthorpe (es. "assassin" non viene bloccato per "ass").
 *
 * Le liste sono volutamente nel frontend e non gestite dal pannello admin,
 * coerentemente con la blacklist statica già esistente.
 *
 * @see src/data/nicknameBlacklist.ts — nomi di sistema riservati
 * @see docs/wiki/backend-strapi.md — sezione Nickname
 */

/**
 * Radici offensive italiane. Il confronto è per sottostringa, quindi una sola
 * radice copre le varianti flesse (es. "stronz" → stronzo/stronza/stronzi…).
 * Inserire sempre voci in minuscolo, senza accenti e con soli caratteri a–z.
 */
const ITALIAN_BAD_WORDS: readonly string[] = [
    // Volgarità comuni (radici)
    'cazz',
    'cazzat',
    'incazz',
    'stronz',
    'merd',
    'troia',
    'troie',
    'puttan',
    'puttana',
    'mignott',
    'zoccol',
    'vaffancul',
    'fancul',
    'cul', // stringente: include culo/inculo/leccaculo
    'incul',
    'coglion',
    'minchia',
    'minchion',
    'bastard',
    'figliodiput',
    'figliadiput',
    'pompin',
    'bocchin',
    'sborr',
    'sega', // segaiolo/seghe
    'segaiol',
    'frocio',
    'froci',
    'ricchion',
    'culatton',
    'negro',
    'negri',
    'ritard', // ritardato (offensivo)
    'handicapp',
    'mongoloid',
    'cesso',
    'scrof',
    'porc', // porco/porca (usato in bestemmie e insulti)

    // Bestemmie e combinazioni blasfeme (forma compatta, senza separatori)
    'diocan',
    'diocane',
    'porcodio',
    'dioporco',
    'dioboia',
    'diomerd',
    'madonnaputt',
    'porcamadonn',
    'cristodi',
] as const;

/**
 * Bad words inglesi. Confronto "blando": solo match esatto su token o
 * sull'intero nickname. Inserire le voci in minuscolo, soli caratteri a–z.
 */
const ENGLISH_BAD_WORDS: readonly string[] = [
    'fuck',
    'fucker',
    'fucking',
    'motherfucker',
    'shit',
    'bullshit',
    'bitch',
    'cunt',
    'dick',
    'cock',
    'pussy',
    'ass',
    'asshole',
    'bastard',
    'slut',
    'whore',
    'fag',
    'faggot',
    'nigger',
    'nigga',
    'retard',
    'wanker',
    'twat',
    'jerkoff',
    'rape',
    'rapist',
    'nazi',
    'porn',
] as const;

/** Lowercase + rimozione accenti (NFD). */
function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

/**
 * Forma "compatta" per il match stringente italiano:
 * normalizza, converte il leet-speak più comune e tiene solo le lettere a–z.
 */
function compact(value: string): string {
    const leet: Record<string, string> = {
        '0': 'o',
        '1': 'i',
        '3': 'e',
        '4': 'a',
        '5': 's',
        '7': 't',
        '8': 'b',
        '@': 'a',
        '$': 's',
        '€': 'e',
        '!': 'i',
    };

    return normalize(value)
        .replace(/[0134578@$€!]/g, (char) => leet[char] ?? char)
        .replace(/[^a-z]/g, '');
}

/** Bad word italiana presente come sottostringa (controllo stringente). */
export function containsItalianBadWord(nickname: string): boolean {
    const compacted = compact(nickname);
    if (!compacted) return false;
    return ITALIAN_BAD_WORDS.some((word) => compacted.includes(word));
}

/** Bad word inglese come token isolato o intero nickname (controllo blando). */
export function containsEnglishBadWord(nickname: string): boolean {
    const normalized = normalize(nickname);
    const whole = normalized.replace(/[^a-z]/g, '');
    const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
    return ENGLISH_BAD_WORDS.some((word) => whole === word || tokens.includes(word));
}

/**
 * true se il nickname contiene/è una bad word italiana o inglese.
 * È la funzione da usare nelle validazioni (client-side e server-side).
 */
export function containsBadWord(nickname: string): boolean {
    return containsItalianBadWord(nickname) || containsEnglishBadWord(nickname);
}
