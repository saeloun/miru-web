export const OUTSTANDING_INVOICE_REPORT_PAGE = "Invoice Report";

export const filterIntialValues = {
  dateRange: { label: "", value: "" },
  clients: [],
  teamMember: [],
  status: [],
  customDateFilter: {
    from: "",
    to: "",
  },
};

export const initialFilterOptions = {
  clients: [],
  teamMembers: [],
};

export const getSummaryList = (
  isDesktop = false,
  outstandingOverdueInvoice: any = {}
) =>
  isDesktop
    ? [
        {
          label: "TOTAL OUTSTANDING",
          value: outstandingOverdueInvoice?.summary?.totalOutstandingAmount,
        },
        {
          label: "TOTAL OVERDUE",
          value: outstandingOverdueInvoice?.summary?.totalOverdueAmount,
        },
        {
          label: "TOTAL INVOICE AMOUNT",
          value: outstandingOverdueInvoice?.summary?.totalInvoiceAmount,
        },
      ]
    : [
        {
          label: "OUTSTANDING",
          value: outstandingOverdueInvoice?.summary?.totalOutstandingAmount,
        },
        {
          label: "OVERDUE",
          value: outstandingOverdueInvoice?.summary?.totalOverdueAmount,
        },
      ];
