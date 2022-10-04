export const getMonthFromString = (mon) => {
  const d = Date.parse(mon + "1, 2012");
  if (!isNaN(d)) {
    return new Date(d).getMonth() + 1;
  }
  return -1;
};
