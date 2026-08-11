"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultLocale, getDictionary, isLocale, LOCALE_STORAGE_KEY, type Dictionary, type Locale } from "./config";

interface I18nContextValue {
  locale: Locale;
  t: (path: string) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// path แบบ "nav.overview" — คืนค่า path เดิมถ้าไม่เจอ key (เห็นง่ายว่าลืมแปล ดีกว่าเงียบ/blank)
function resolvePath(dict: Dictionary, path: string): string {
  const value: unknown = path
    .split(".")
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), dict);
  return typeof value === "string" ? value : path;
}

// SSR/hydration ต้อง render defaultLocale เสมอ ไม่อ่าน cookie/localStorage ฝั่ง server เลย —
// เคยลองอ่าน locale จาก cookie ใน root layout (Server Component) มาก่อน แล้วเจอ useId() hydration
// mismatch ที่ CommandPalette's Dialog ซ้ำ ๆ ทุกครั้งที่ navigate หาสาเหตุจริงไม่เจอแม้ตัด cookies()/
// async ออกหมดแล้วก็ยังเจอ (สงสัยว่าเกี่ยวกับ RSC client-reference boundary แต่ไม่ยืนยันได้แน่ชัดในเวลาที่มี)
// แก้ด้วย pattern ที่ปลอดภัยกว่า: SSR เป็น default เสมอ (ไม่มีทางต่างจาก client ตอน hydrate)
// แล้วค่อย sync จาก localStorage หลัง mount ผ่าน useEffect — เปลี่ยน state ปกติ ไม่ใช่ hydration diff
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored) && stored !== defaultLocale) setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  };

  const dict = getDictionary(locale);
  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: (path: string) => resolvePath(dict, path), setLocale }),
    [locale, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n ต้องอยู่ใต้ I18nProvider");
  return ctx;
}
