import { Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";

const getReportData = async ({
  setClientList,
  setShowNavFilters,
  setIsFilterVisible,
  setSummary,
  setCurrency,
  filters = {},
}) => {
  try {
    // Build query params for filtering invoices
    const queryParams = new URLSearchParams();

    // Filter for outstanding and overdue statuses
    queryParams.append("status[]", "sent");
    queryParams.append("status[]", "viewed");
    queryParams.append("status[]", "overdue");

    // Add client filters if provided
    if (filters.clients && filters.clients.length > 0) {
      filters.clients.forEach(client => {
        queryParams.append("client_ids[]", client.value);
      });
    }

    // Add date range filters if provided
    if (filters.dateRange && filters.dateRange.value) {
      if (filters.dateRange.from) {
        queryParams.append("from_date", filters.dateRange.from);
      }

      if (filters.dateRange.to) {
        queryParams.append("to_date", filters.dateRange.to);
      }
    }

    // Use existing invoices API with filters
    const res = await invoicesApi.get(queryParams.toString());

    // Process invoices data to match the expected format
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

      // Calculate amounts using amount_due
      const amountDue = invoice.amount_due || invoice.amount || 0;

      if (invoice.status === "overdue") {
        client.total_overdue_amount += parseFloat(amountDue);
      } else if (["sent", "viewed"].includes(invoice.status)) {
        client.total_outstanding_amount += parseFloat(amountDue);
      }
    });

    // Convert map to array
    const clientsList = Array.from(clientsMap.values());

    // Calculate summary
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
