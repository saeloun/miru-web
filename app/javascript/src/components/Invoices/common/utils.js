export const generate_invoice_line_items = (selectedLineItems, manualEntryArr) => {
  let invoice_line_items = [];
  invoice_line_items = invoice_line_items.concat(
    selectedLineItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      date: item.date,
      rate: item.rate,
      quantity: item.qty,
      timesheet_entry_id: item.time_sheet_entry
    }))
  );

  invoice_line_items = invoice_line_items.concat(
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

  return invoice_line_items;
};
