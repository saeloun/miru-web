export interface LocaleInfo {
  code: string;
  nativeName: string;
  englishName?: string;
}

export interface LocaleGroup {
  label: string;
  locales: LocaleInfo[];
}

export const LOCALE_GROUPS: LocaleGroup[] = [
  {
    label: "ENGLISH",
    locales: [
      { code: "en-GB", nativeName: "English (UK)" },
      { code: "en-US", nativeName: "English (US)" },
    ],
  },
  {
    label: "INDIAN",
    locales: [
      { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
      { code: "mr", nativeName: "मराठी", englishName: "Marathi" },
      { code: "bn", nativeName: "বাংলা", englishName: "Bengali" },
      { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati" },
      { code: "kn", nativeName: "ಕನ್ನಡ", englishName: "Kannada" },
      { code: "ml", nativeName: "മലയാളം", englishName: "Malayalam" },
      { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
      { code: "ta", nativeName: "தமிழ்", englishName: "Tamil" },
      { code: "te", nativeName: "తెలుగు", englishName: "Telugu" },
      { code: "ur", nativeName: "اردو", englishName: "Urdu" },
    ],
  },
  {
    label: "EUROPEAN",
    locales: [
      { code: "es", nativeName: "Español" },
      { code: "fr", nativeName: "Français" },
      { code: "de", nativeName: "Deutsch" },
      { code: "it", nativeName: "Italiano" },
      { code: "nl", nativeName: "Nederlands" },
      { code: "pt-BR", nativeName: "Português (BR)" },
      { code: "tr", nativeName: "Türkçe" },
    ],
  },
  {
    label: "EAST ASIAN",
    locales: [
      { code: "ja", nativeName: "日本語", englishName: "Japanese" },
      { code: "ko", nativeName: "한국어", englishName: "Korean" },
      { code: "zh-CN", nativeName: "中文简体", englishName: "Chinese" },
    ],
  },
  {
    label: "SOUTHEAST ASIAN",
    locales: [{ code: "id", nativeName: "Bahasa Indonesia" }],
  },
];

export function getLocaleDisplayName(code: string): string {
  for (const group of LOCALE_GROUPS) {
    const locale = group.locales.find(l => l.code === code);
    if (locale) {
      return locale.englishName
        ? `${locale.nativeName} (${locale.englishName})`
        : locale.nativeName;
    }
  }

  return code;
}

export function getLocaleShortCode(code: string): string {
  return code.split("-")[0].toUpperCase();
}
