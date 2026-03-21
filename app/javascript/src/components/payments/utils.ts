export const getStatusCss = (paymentStatus: string) => {
  const STATUS_LIST = {
    paid: "bg-accent text-primary text-xs font-sans tracking-xs-widest w-auto text-center justify-center items-center",
    partially_paid:
      "bg-muted text-foreground w-auto text-center justify-center items-center",
    failed:
      "bg-card text-card-foreground text-xs font-sans tracking-xs-widest w-auto text-center justify-center items-center",
  };
  const lowerCaseStatus = paymentStatus.toLowerCase();

  return `rounded-lg px-1 ${STATUS_LIST[lowerCaseStatus]}`;
};
