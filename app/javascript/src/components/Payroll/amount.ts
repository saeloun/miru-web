export const exactAmount = (
  value: unknown,
  currency: string,
  minor = true
): string => {
  if (typeof value !== "string" || !["INR", "USD"].includes(currency)) {
    return "Unavailable";
  }

  if (!(minor ? /^-?\d{1,80}$/ : /^-?\d{1,80}(\.\d{1,40})?$/).test(value)) {
    return "Unavailable";
  }
  const negative = value.startsWith("-");
  const digits = value.replace(/^-/, "");
  const [whole, fraction] = minor
    ? [digits.padStart(3, "0").slice(0, -2), digits.padStart(3, "0").slice(-2)]
    : digits.split(".");

  const grouped = whole
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "−" : ""}${currency} ${grouped}.${(
    fraction || ""
  ).padEnd(2, "0")}`;
};
