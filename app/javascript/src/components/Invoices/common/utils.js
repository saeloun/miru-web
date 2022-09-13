import dayjs from "dayjs";

export const generateInvoiceLineItems = (selectedLineItems, manualEntryArr) => {
  let invoiceLineItems = [];
  invoiceLineItems = invoiceLineItems.concat(
    selectedLineItems.map((item) => ({
      id: item.id,
      name: item.name ? item.name : `${item.first_name} ${item.last_name}`,
      description: item.description,
      date: dayjs(item.date).format("DD/MM/YYYY"),
      rate: item.rate,
      quantity: Number(item.quantity),
      timesheet_entry_id: item.time_sheet_entry
        ? item.time_sheet_entry
        : item.timesheet_entry_id,
      _destroy: !!item._destroy
    }))
  );

  invoiceLineItems = invoiceLineItems.concat(
    manualEntryArr.map((item) => ({
      idx: item.id,
      name: item.name,
      description: item.description,
      date: dayjs(item.date).format("DD/MM/YYYY"),
      rate: item.rate,
      quantity: Number(item.quantity),
      timesheet_entry_id: item.time_sheet_entry,
      _destroy: !!item._destroy
    }))
  );

  return invoiceLineItems;
};

export const getMaxIdx = (arr) => {
  const ids = arr.map((object) => object.idx);

  if (ids.length > 0) {
    return Math.max(...ids);
  }

  return 0;
};
