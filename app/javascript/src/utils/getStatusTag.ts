const getStatusCssClass = (status) => {
  const STATUS_LIST = {
    draft: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    overdue: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    rejected: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    sent: "bg-miru-alert-green-400 text-miru-alert-green-800",
    viewed: "bg-miru-alert-blue-400 text-miru-alert-blue-1000",
    billed: "bg-miru-alert-green-400 text-miru-alert-green-800",
    accepted: "bg-miru-alert-green-400 text-miru-alert-green-800",
    unbilled: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    paid: "bg-miru-han-purple-100 text-miru-han-purple-1000",
    ready_for_approval: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    nonbilled: "bg-miru-dark-purple-100 text-miru-dark-purple-600",
    hot: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    warm: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    cold: "bg-miru-alert-blue-400 text-miru-alert-blue-1000",
    new: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    contacted: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    qualified: "bg-miru-alert-green-400 text-miru-alert-green-800",
    lost: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    "cannot contact": "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    "no longer interested": "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    canceled: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    free: "bg-miru-alert-pink-400 text-miru-alert-red-1000",
    partially: "bg-miru-alert-yellow-400 text-miru-alert-green-1000",
    fully: "bg-miru-alert-green-400 text-miru-alert-green-800",
    over: "bg-miru-alert-green-800 text-miru-white-1000",
  };
  const lowerCaseStatus = status.toLowerCase();
  return `rounded-xl text-xs tracking-widest font-semibold px-1 ${STATUS_LIST[lowerCaseStatus]}`;
};

export default getStatusCssClass;
