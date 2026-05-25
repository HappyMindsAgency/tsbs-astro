/**
 * Blacklist statica di username/nickname non ammessi.
 *
 * Regole:
 * - Parole offensive o volgari.
 * - Nomi riservati al sistema (admin, bot, strapi, ecc.).
 * - Il confronto avviene in lowercase: aggiungere le voci già in minuscolo.
 * - La lista non è modificabile dal pannello admin Strapi (gestione frontend).
 *
 * @see docs/wiki/backend-strapi.md — sezione Nickname
 */
export const nicknameBlacklist: readonly string[] = [
    // Nomi di sistema riservati
    'admin',
    'administrator',
    'moderator',
    'strapi',
    'sistema',
    'support',
    'supporto',
    'staff',
    'bot',
    'root',
    'superuser',
    'tsbs',
    'thesecretbookishsociety',

    // TODO: espandere con parole offensive appropriate al contesto italiano
] as const;

/**
 * Verifica se un username è presente nella blacklist.
 * Il confronto è case-insensitive.
 *
 * @param username Il nome utente da verificare.
 * @returns true se il nickname è bloccato, false altrimenti.
 */
export function isNicknameBlacklisted(username: string): boolean {
    return nicknameBlacklist.includes(username.toLowerCase().trim());
}
