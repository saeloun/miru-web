const getStatusCssClass = status => {
  const STATUS_LIST = {
    draft: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    overdue: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    sent: "bg-miru-alert-green-400 text-miru-alert-green-800",
    viewed: "bg-miru-alert-blue-400 text-miru-alert-blue-1000",
    billed: "bg-miru-alert-green-400 text-miru-alert-green-800",
    unbilled: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    nonbilled: "bg-miru-dark-purple-100 text-miru-dark-purple-600",
    paid: "bg-miru-han-purple-100 text-miru-han-purple-1000",
    declined: "bg-miru-dark-purple-100 text-miru-dark-purple-600",
  };
  const lowerCaseStatus = status.toLowerCase();

  return `rounded-xl text-xs tracking-widest font-semibold px-1 ${STATUS_LIST[lowerCaseStatus]}`;
};

export default getStatusCssClass;
