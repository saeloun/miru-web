import dayjs from "dayjs";

import generateInvoice from "apis/generateInvoice";

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

export const fetchNewLineItems = async (
  selectedClient,
  lineItems,
  setLineItems,
  setTotalLineItems,
  pageNumber,
  setPageNumber,
  selectedEntries = [],
) => {
  if (selectedClient) {
    let selectedEntriesString = "";
    selectedEntries.forEach((entries) => {
      selectedEntriesString += `&selected_entries[]=${entries.id}`;
    });

    const queryParams = `client_id=${selectedClient.value}&page=${pageNumber}${selectedEntriesString}`;

    const res = await generateInvoice.getLineItems(queryParams);
    setPageNumber(pageNumber + 1);
    const mergedItems = [...res.data.new_line_item_entries, ...lineItems];
    const sortedData = mergedItems.sort((item1, item2) => dayjs(item1.date).isAfter(dayjs(item2.date)) ? 1 : -1);
    setLineItems(sortedData);
    setTotalLineItems(sortedData.length);
  }
};
