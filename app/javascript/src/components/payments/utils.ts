export const getStatusCss = (paymentStatus: string) => {
  const STATUS_LIST = {
    paid: "bg-miru-han-purple-100 text-miru-han-purple-1000 text-xs font-manrope tracking-xs-widest w-auto text-center justify-center items-center",
    partially_paid:
      "bg-miru-alert-yellow-400 text-miru-alert-green-1000 w-auto text-center justify-center items-center",
    failed:
      "bg-miru-alert-pink-400 text-miru-alert-red-1000 text-xs font-manrope tracking-xs-widest w-auto text-center justify-center items-center",
  };
  const lowerCaseStatus = paymentStatus.toLowerCase();

  return `rounded-lg px-1 ${STATUS_LIST[lowerCaseStatus]}`;
};
