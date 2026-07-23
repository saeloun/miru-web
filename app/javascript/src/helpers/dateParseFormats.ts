const FALLBACK_FORMATS = [
  "YYYY-MM-DD",
  "MM-DD-YYYY",
  "DD-MM-YYYY",
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "MM.DD.YYYY",
  "DD.MM.YYYY",
  "YYYY.MM.DD",
];

export const buildDateParseFormats = (companyDateFormat?: string): string[] => {
  const companyFormats = companyDateFormat
    ? [companyDateFormat, companyDateFormat.replace(/[-/]/g, ".")]
    : [];

  return Array.from(new Set([...companyFormats, ...FALLBACK_FORMATS]));
};
