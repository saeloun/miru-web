const cashFormatter = (num: number, digits: number = 2) => {
  if(!num) return '0.00k';
  let units = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  let floor = Math.floor(Math.abs(num).toString().length / 3);
  let value = +(num / Math.pow(1000, floor))
  const currency = units[floor - 1] ? units[floor - 1] : 'k'
  return value.toFixed(value > 1 ? digits : 2) + currency;
}

export { cashFormatter };
