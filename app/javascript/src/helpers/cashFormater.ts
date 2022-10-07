export const cashFormatter = (num: number, digits = 2) => {
  if (!num) return "0.00";
  const units = ["k", "M", "G", "T", "P", "E", "Z", "Y"];
  const floor = Math.floor(Math.abs(Math.trunc(num)).toString().length / 3);
  const value = +(num / Math.pow(1000, floor));
  const currency = units[floor - 1] ? units[floor - 1] : "";
  return value.toFixed(value > 1 ? digits : 2) + currency;
};
