export const LANGUAGES = ["it", "en"] as const;

export type Lang = (typeof LANGUAGES)[number];

export const DEFAULT_LANG: Lang = "it";

export function isLang(value: string): value is Lang {
  return LANGUAGES.includes(value as Lang);
}
