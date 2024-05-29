const OutstandingOverdueInvoiceContext = {
  filterOptions: {
    clients: [],
    teamMembers: [],
  },
  selectedFilter: {
    dateRange: { label: "All", value: "" },
    clients: [],
  },
  customDateFilter: {
    from: "",
    to: "",
  },
  filterCounter: 0,
  clientList: [],
  currency: "",
  summary: {
    totalInvoiceAmount: 0,
    totalOutstandingAmount: 0,
    totalOverdueAmount: 0,
  },
  handleRemoveSingleFilter: (key, value) => {}, //eslint-disable-line
};

export default OutstandingOverdueInvoiceContext;
