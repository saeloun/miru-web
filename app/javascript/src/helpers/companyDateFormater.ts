export const companyDateFormater = dateFormat => {
  switch (dateFormat) {
    case "DD-MM-YYYY":
      return "DD.MM.YYYY";
    case "YYYY-MM-DD":
      return "YYYY.MM.DD";
    case "MM-DD-YYYY":
      return "MM.DD.YYYY";
    default:
      return "DD.MM.YYYY";
  }
};
