import { getActiveLocale } from "../i18n";

const fallbackLocaleByCurrency = baseCurrency => {
  switch (baseCurrency) {
    case "INR":
      return "en-IN";
    case "USD":
      return "en-US";
    case "EUR":
      return "de-DE";
    case "JPY":
      return "ja-JP";
    case "GBP":
      return "en-GB";
    case "CAD":
      return "en-CA";
    case "AUD":
      return "en-AU";
    default:
      return "en-US";
  }
};

const normalizedLocale = (localeValue?: string | null) => {
  const value = localeValue?.trim();

  return value && value.length > 0 ? value : null;
};

const currencyFormat = (
  baseCurrency,
  amount,
  notation?: "standard" | "compact",
  localeOverride?: string
) => {
  // Default to USD if no currency provided
  const currency = baseCurrency || "USD";
  const activeLocale =
    normalizedLocale(localeOverride) ||
    normalizedLocale(getActiveLocale()) ||
    fallbackLocaleByCurrency(currency);

  // Ensure amount is a valid number, default to 0 if not
  const numericAmount =
    typeof amount === "number" && !isNaN(amount)
      ? amount
      : parseFloat(amount) || 0;

  return new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    notation,
  }).format(numericAmount);
};

export { currencyFormat };
