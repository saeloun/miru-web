const locale = baseCurrency => {
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

const currencyFormat = ({ baseCurrency, amount }) => {
  const formattedAmount = new Intl.NumberFormat(locale(baseCurrency), {
    style: "currency",
    currency: baseCurrency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  return formattedAmount;
};

const currencyNotationFormat = ({ baseCurrency, amount }) => {
  const formattedAmount = new Intl.NumberFormat(locale(baseCurrency), {
    style: "currency",
    currency: baseCurrency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    notation: amount > 99999 ? "compact" : "standard",
  }).format(amount);

  return formattedAmount;
};

export { currencyFormat, currencyNotationFormat };
