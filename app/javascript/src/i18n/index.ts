import { I18n } from "i18n-js";

import en from "./locales/en";

const SUPPORTED_LOCALES = [
  "en", "en-GB", "en-US",
  "hi", "mr", "bn", "gu", "kn", "ml", "pa", "ta", "te", "ur",
  "es", "fr", "de", "it", "nl", "id", "pt-BR", "tr",
  "ja", "ko", "zh-CN",
] as const;

type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const LOCALE_STORAGE_KEY = "miru-locale";
const BROWSER_COUNTRY_STORAGE_KEY = "miru_browser_country";
const BROWSER_TIMEZONE_STORAGE_KEY = "miru_browser_timezone";

const i18n = new I18n({ en });
i18n.defaultLocale = "en";
i18n.locale = "en";
i18n.enableFallback = true;

async function loadLocale(locale: string): Promise<boolean> {
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    i18n.locale = "en";
    return false;
  }
  if (locale === "en") { i18n.locale = "en"; return true; }
  try {
    const module = await import(/* @vite-ignore */ `./locales/${locale}.ts`);
    i18n.store(module.default);
    i18n.locale = locale;
    return true;
  } catch {
    i18n.locale = "en";
    return false;
  }
}

function getStoredLocale(): string {
  try { return localStorage.getItem(LOCALE_STORAGE_KEY) || "en"; }
  catch { return "en"; }
}

function setStoredLocale(locale: string): void {
  try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch {}
}

function detectBrowserLocale(): string {
  try {
    const browserLang = navigator.language;
    if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) return browserLang;
    const shortLang = browserLang.split("-")[0];
    const match = SUPPORTED_LOCALES.find(l => l === shortLang || l.startsWith(shortLang + "-"));
    return match || "en";
  } catch { return "en"; }
}

function getActiveLocale(): string {
  return i18n.locale || "en";
}

function normalizeLocale(locale?: string | null): string {
  const value = locale?.trim();
  if (!value) return "en";
  if (SUPPORTED_LOCALES.includes(value as SupportedLocale)) return value;
  const base = value.split("-")[0]?.toLowerCase();
  return SUPPORTED_LOCALES.find(s => s.toLowerCase() === base) || "en";
}

function applyLocale(locale?: string | null): string {
  const target = normalizeLocale(locale || getStoredLocale());
  loadLocale(target);
  setStoredLocale(target);
  if (typeof document !== "undefined") document.documentElement.lang = target;
  return target;
}

function initializeLocale(preferredLocale?: string | null): string {
  persistBrowserProfile();
  return applyLocale(preferredLocale || getStoredLocale() || detectBrowserLocale());
}

function detectBrowserCountry(): string {
  try {
    const locale = navigator.languages?.[0] || navigator.language || "en-US";
    return (locale.split("-")[1] || "US").toUpperCase();
  } catch { return "US"; }
}

function detectBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function persistBrowserProfile(): void {
  try {
    localStorage.setItem(BROWSER_COUNTRY_STORAGE_KEY, detectBrowserCountry());
    localStorage.setItem(BROWSER_TIMEZONE_STORAGE_KEY, detectBrowserTimeZone());
  } catch {}
}

function getStoredBrowserCountry(): string {
  try { return localStorage.getItem(BROWSER_COUNTRY_STORAGE_KEY) || detectBrowserCountry(); }
  catch { return "US"; }
}

function getStoredBrowserTimeZone(): string {
  try { return localStorage.getItem(BROWSER_TIMEZONE_STORAGE_KEY) || detectBrowserTimeZone(); }
  catch { return "UTC"; }
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AU: "AUD", BR: "BRL", CA: "CAD", CN: "CNY", DE: "EUR", ES: "EUR",
  FR: "EUR", GB: "GBP", IN: "INR", JP: "JPY", PT: "EUR", US: "USD",
};

function defaultCurrencyForCountry(countryCode?: string): string {
  return COUNTRY_TO_CURRENCY[(countryCode || getStoredBrowserCountry()).toUpperCase()] || "USD";
}

function defaultDateFormatForCountry(countryCode?: string): string {
  const country = (countryCode || getStoredBrowserCountry()).toUpperCase();
  if (["IN", "GB", "DE", "FR", "ES", "BR", "PT"].includes(country)) return "DD-MM-YYYY";
  if (["JP", "CN"].includes(country)) return "YYYY-MM-DD";
  return "MM-DD-YYYY";
}

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

const LANGUAGE_OPTIONS = SUPPORTED_LOCALES.map(code => ({ value: code, label: code }));

export {
  i18n,
  t,
  loadLocale,
  applyLocale,
  initializeLocale,
  normalizeLocale,
  getStoredLocale,
  setStoredLocale,
  detectBrowserLocale,
  detectBrowserCountry,
  detectBrowserTimeZone,
  persistBrowserProfile,
  getStoredBrowserCountry,
  getStoredBrowserTimeZone,
  defaultCurrencyForCountry,
  defaultDateFormatForCountry,
  getActiveLocale,
  SUPPORTED_LOCALES,
  LANGUAGE_OPTIONS,
  LOCALE_STORAGE_KEY,
  BROWSER_COUNTRY_STORAGE_KEY,
  BROWSER_TIMEZONE_STORAGE_KEY,
};
export type { SupportedLocale };
