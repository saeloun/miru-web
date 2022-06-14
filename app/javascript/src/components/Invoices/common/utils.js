export const generateInvoiceLineItems = (selectedLineItems, manualEntryArr) => {
  let invoiceLineItems = [];
  invoiceLineItems = invoiceLineItems.concat(
    selectedLineItems.map((item) => ({
      id: item.id,
      name: item.name ? item.name : `${item.first_name} ${item.last_name}`,
      description: item.description,
      date: item.date,
      rate: item.rate,
      quantity: item.qty,
      timesheet_entry_id: item.time_sheet_entry ? item.time_sheet_entry : item.timesheet_entry_id
    }))
  );

  invoiceLineItems = invoiceLineItems.concat(
    manualEntryArr.map((item) => ({
      idx: item.id,
      name: item.name,
      description: item.description,
      date: item.date,
      rate: item.rate,
      quantity: item.qty,
      timesheet_entry_id: item.time_sheet_entry
    }))
  );

  return invoiceLineItems;
};
