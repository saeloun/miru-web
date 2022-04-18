const locale = (baseCurrency) => {
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

export const currencyFormat = ({ baseCurrency, amount }) => {
  const formattedAmount = new Intl.NumberFormat(locale(baseCurrency), {
    style: "currency",
    currency: baseCurrency
  }).format(amount);

  return formattedAmount;
};
