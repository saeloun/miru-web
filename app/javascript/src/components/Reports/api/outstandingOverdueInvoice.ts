import { Toastr } from "StyledComponents";

import { invoicesApi } from "apis/api";

const getReportData = async ({
  setClientList,
  setShowNavFilters,
  setIsFilterVisible,
  setSummary,
  setCurrency,
  filters = {},
}) => {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append("status[]", "sent");
    queryParams.append("status[]", "viewed");
    queryParams.append("status[]", "overdue");

    if (filters.clients && filters.clients.length > 0) {
      filters.clients.forEach(client => {
        queryParams.append("client_ids[]", client.value);
      });
    }

    if (filters.dateRange && filters.dateRange.value) {
      if (filters.dateRange.from) {
        queryParams.append("from_date", filters.dateRange.from);
      }

      if (filters.dateRange.to) {
        queryParams.append("to_date", filters.dateRange.to);
      }
    }

    const res = await invoicesApi.get(queryParams.toString());

    const invoices = res.data.invoices || [];
    const clientsMap = new Map();

    // Group invoices by client
    invoices.forEach(invoice => {
      const clientId = invoice.client_id;
      const clientName = invoice.client_name || invoice.client?.name;

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          name: clientName,
          logo: invoice.client?.logo,
          invoices: [],
          total_outstanding_amount: 0,
          total_overdue_amount: 0,
        });
      }

      const client = clientsMap.get(clientId);
      client.invoices.push(invoice);

      const amountDue = invoice.amount_due || invoice.amount || 0;

      if (invoice.status === "overdue") {
        client.total_overdue_amount += parseFloat(amountDue);
      } else if (["sent", "viewed"].includes(invoice.status)) {
        client.total_outstanding_amount += parseFloat(amountDue);
      }
    });

    const clientsList = Array.from(clientsMap.values());

    const summary = {
      totalInvoiceAmount: invoices.reduce(
        (sum, inv) => sum + parseFloat(inv.amount_due || inv.amount || 0),
        0
      ),
      totalOutstandingAmount: invoices
        .filter(inv => ["sent", "viewed"].includes(inv.status))
        .reduce(
          (sum, inv) => sum + parseFloat(inv.amount_due || inv.amount || 0),
          0
        ),
      totalOverdueAmount: invoices
        .filter(inv => inv.status === "overdue")
        .reduce(
          (sum, inv) => sum + parseFloat(inv.amount_due || inv.amount || 0),
          0
        ),
    };

    setClientList(clientsList);
    setCurrency(res.data.currency || "USD");
    setSummary(summary);
    setShowNavFilters(true);
    setIsFilterVisible(false);
  } catch (error) {
    Toastr.error(error.message);
  }
};

export default getReportData;
