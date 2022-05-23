export const currencySymbol = (baseCurrency) => {
  switch (baseCurrency) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "JPY":
      return "¥";
    case "GBP":
      return "£";
    case "CAD":
      return "$";
    case "AUD":
      return "$";
    default:
      return "$";
  }
};
