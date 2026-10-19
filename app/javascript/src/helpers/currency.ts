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
  const currency = baseCurrency || "USD";
  const activeLocale =
    normalizedLocale(localeOverride) ||
    normalizedLocale(getActiveLocale()) ||
    fallbackLocaleByCurrency(currency);

  const numericAmount =
    typeof amount === "number" && !isNaN(amount)
      ? amount
      : parseFloat(amount) || 0;

  const formatter = new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    notation,
  });

  const decimal =
    typeof amount === "string"
      ? amount.match(/^([+-]?\d+)(?:\.(\d{1,2}))?$/)
      : null;

  if (decimal && notation !== "compact") {
    // Separate exact integers and cents for browsers that round decimal strings.
    const integers = formatter
      .formatToParts(BigInt(decimal[1]))
      .filter(part => part.type === "integer" || part.type === "group");

    const fraction = Number(
      `${decimal[1].startsWith("-") ? "-" : ""}0.${decimal[2] || "0"}`
    );

    return formatter
      .formatToParts(numericAmount === 0 ? 0 : fraction)
      .flatMap(part => (part.type === "integer" ? integers : part))
      .map(part => part.value)
      .join("");
  }

  return formatter.format(numericAmount);
};

export { currencyFormat };
