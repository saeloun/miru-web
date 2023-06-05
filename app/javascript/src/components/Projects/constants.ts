export const tableHeader = [
  {
    Header: "TEAM MEMBER",
    accessor: "col1", // accessor is the "key" in the data
    cssClass: "",
  },
  {
    Header: "HOURLY RATE",
    accessor: "col2",
    cssClass: "text-right",
  },
  {
    Header: "HOURS LOGGED",
    accessor: "col3",
    cssClass: "text-right", // accessor is the "key" in the data
  },
  {
    Header: "COST",
    accessor: "col4",
    cssClass: "text-right", // accessor is the "key" in the data
  },
];

export const getAmountBox = (
  currencySymb: string,
  cashFormatter: any,
  overdueOutstandingAmount: any
) => [
  {
    title: "OVERDUE",
    amount:
      currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount),
  },
  {
    title: "OUTSTANDING",
    amount:
      currencySymb +
      cashFormatter(overdueOutstandingAmount?.outstanding_amount),
  },
];
