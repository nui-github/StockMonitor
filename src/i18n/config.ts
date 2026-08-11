import th from "./th.json";
import en from "./en.json";

export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];

// CLAUDE.md: default เป็นภาษาไทย — ต้องเป็นค่านี้เสมอ ไม่ใช่ตาม browser locale
export const defaultLocale: Locale = "th";

export const LOCALE_STORAGE_KEY = "locale";

export type Dictionary = typeof th;

const dictionaries: Record<Locale, Dictionary> = { th, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value) && (locales as readonly string[]).includes(value!);
}
