export const getStatusCss = (paymentStatus: string) => {
  const STATUS_LIST = {
    paid: "bg-accent text-primary text-xs font-sans tracking-xs-widest w-auto text-center justify-center items-center",
    partially_paid:
      "bg-amber-100 text-amber-900 w-auto text-center justify-center items-center",
    failed:
      "bg-rose-100 text-rose-700 text-xs font-sans tracking-xs-widest w-auto text-center justify-center items-center",
  };
  const lowerCaseStatus = paymentStatus.toLowerCase();

  return `rounded-lg px-1 ${STATUS_LIST[lowerCaseStatus]}`;
};
