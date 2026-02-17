const getStatusCssClass = status => {
  const STATUS_LIST = {
    // Active states
    draft: "bg-amber-100 text-amber-800",
    sent: "bg-blue-100 text-blue-800",
    viewed: "bg-indigo-100 text-indigo-800",
    sending: "bg-sky-100 text-sky-800",

    // Success states
    paid: "bg-green-100 text-green-800",
    billed: "bg-green-100 text-green-800",

    // Warning states
    overdue: "bg-red-100 text-red-800",
    declined: "bg-rose-100 text-rose-800",

    // Pending states
    pending: "bg-violet-100 text-violet-800",
    unbilled: "bg-yellow-100 text-yellow-800",

    // Neutral states
    waived: "bg-gray-200 text-gray-700",
    nonbilled: "bg-slate-100 text-slate-700",
    non_billable: "bg-zinc-100 text-zinc-700",

    // Payment specific states
    partially_paid: "bg-orange-100 text-orange-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
    processing: "bg-indigo-100 text-indigo-800",
    cancelled: "bg-gray-200 text-gray-700",
  };
  const lowerCaseStatus = status.toLowerCase().replace(/\s+/g, "_");

  return `rounded-full px-2.5 py-1 text-xs tracking-wide font-semibold ${
    STATUS_LIST[lowerCaseStatus] || "bg-gray-100 text-gray-700"
  }`;
};

export default getStatusCssClass;
