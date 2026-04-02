import { I18n } from "i18n-js";

import en from "./locales/en";

const SUPPORTED_LOCALES = [
  "en",
  "en-GB",
  "en-US",
  "hi",
  "mr",
  "bn",
  "gu",
  "kn",
  "ml",
  "pa",
  "ta",
  "te",
  "ur",
  "es",
  "fr",
  "de",
  "it",
  "nl",
  "id",
  "pt-BR",
  "tr",
  "ja",
  "ko",
  "zh-CN",
] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const i18n = new I18n({ en });
i18n.defaultLocale = "en";
i18n.locale = "en";
i18n.enableFallback = true;
i18n.missingBehavior = "guess";

const LOCALE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "en-GB": () => import("./locales/en-GB"),
  "en-US": () => import("./locales/en-US"),
  hi: () => import("./locales/hi"),
  mr: () => import("./locales/mr"),
  bn: () => import("./locales/bn"),
  gu: () => import("./locales/gu"),
  kn: () => import("./locales/kn"),
  ml: () => import("./locales/ml"),
  pa: () => import("./locales/pa"),
  ta: () => import("./locales/ta"),
  te: () => import("./locales/te"),
  ur: () => import("./locales/ur"),
  es: () => import("./locales/es"),
  fr: () => import("./locales/fr"),
  de: () => import("./locales/de"),
  it: () => import("./locales/it"),
  nl: () => import("./locales/nl"),
  id: () => import("./locales/id"),
  "pt-BR": () => import("./locales/pt-BR"),
  tr: () => import("./locales/tr"),
  ja: () => import("./locales/ja"),
  ko: () => import("./locales/ko"),
  "zh-CN": () => import("./locales/zh-CN"),
};

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, options);

async function loadLocale(locale: string): Promise<boolean> {
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    console.warn(`Unsupported locale: ${locale}, falling back to en`);
    i18n.locale = "en";

    return false;
  }

  if (locale === "en") {
    i18n.locale = "en";

    return true;
  }

  try {
    const loadTranslations = LOCALE_LOADERS[locale];
    if (!loadTranslations) {
      throw new Error(`No translations registered for locale ${locale}`);
    }

    const module = await loadTranslations();
    const translations = module.default;

    i18n.store({ [locale]: translations });
    i18n.locale = locale;

    return true;
  } catch (error) {
    console.warn(`Failed to load locale ${locale}, falling back to en:`, error);
    i18n.locale = "en";

    return false;
  }
}

function getStoredLocale(): string {
  try {
    return localStorage.getItem("miru-locale") || "en";
  } catch {
    return "en";
  }
}

function setStoredLocale(locale: string): void {
  try {
    localStorage.setItem("miru-locale", locale);
  } catch {
    return;
  }
}

function detectBrowserLocale(): string {
  try {
    const browserLang = navigator.language;
    if ((SUPPORTED_LOCALES as readonly string[]).includes(browserLang)) {
      return browserLang;
    }
    const shortLang = browserLang.split("-")[0];
    const match = (SUPPORTED_LOCALES as readonly string[]).find(
      l => l === shortLang || l.startsWith(`${shortLang}-`)
    );

    return match || "en";
  } catch {
    return "en";
  }
}

function getActiveLocale(): string {
  return i18n.locale || "en";
}

function getStoredBrowserCountry(): string {
  try {
    return localStorage.getItem("miru_browser_country") || "";
  } catch {
    return "";
  }
}

function getStoredBrowserTimeZone(): string {
  try {
    return (
      localStorage.getItem("miru_browser_timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      ""
    );
  } catch {
    return "";
  }
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AU: "AUD",
  BR: "BRL",
  CA: "CAD",
  CN: "CNY",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  IN: "INR",
  JP: "JPY",
  PT: "EUR",
  US: "USD",
};

function defaultCurrencyForCountry(countryCode?: string): string {
  return (
    COUNTRY_TO_CURRENCY[
      (countryCode || getStoredBrowserCountry() || "US").toUpperCase()
    ] || "USD"
  );
}

function defaultDateFormatForCountry(countryCode?: string): string {
  const country = (
    countryCode ||
    getStoredBrowserCountry() ||
    "US"
  ).toUpperCase();
  if (["IN", "GB", "DE", "FR", "ES", "BR", "PT"].includes(country)) {
    return "DD-MM-YYYY";
  }

  if (["JP", "CN"].includes(country)) return "YYYY-MM-DD";

  return "MM-DD-YYYY";
}

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "en-GB": "English (UK)",
  "en-US": "English (US)",
  hi: "हिन्दी",
  mr: "मराठी",
  bn: "বাংলা",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  ta: "தமிழ்",
  te: "తెలుగు",
  ur: "اردو",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  id: "Bahasa Indonesia",
  "pt-BR": "Português (BR)",
  tr: "Türkçe",
  ja: "日本語",
  ko: "한국어",
  "zh-CN": "中文简体",
};

const LANGUAGE_OPTIONS = SUPPORTED_LOCALES.map(code => ({
  value: code,
  label: LOCALE_LABELS[code] || code,
}));

export {
  i18n,
  t,
  LANGUAGE_OPTIONS,
  loadLocale,
  getStoredLocale,
  setStoredLocale,
  detectBrowserLocale,
  getActiveLocale,
  getStoredBrowserCountry,
  getStoredBrowserTimeZone,
  defaultCurrencyForCountry,
  defaultDateFormatForCountry,
  SUPPORTED_LOCALES,
};
export type { SupportedLocale };
