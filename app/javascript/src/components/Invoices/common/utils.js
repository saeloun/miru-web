import dayjs from "dayjs";
import { lineTotalCalc } from "helpers";

import generateInvoice from "apis/generateInvoice";
import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";

export const generateInvoiceLineItems = (selectedLineItems, manualEntryArr) => {
  let invoiceLineItems = [];
  invoiceLineItems = invoiceLineItems.concat(
    selectedLineItems.map(item => ({
      id: item.id,
      name: item.name ? item.name : `${item.first_name} ${item.last_name}`,
      description: item.description,
      date: dayjs(item.date).format("DD/MM/YYYY"),
      rate: item.rate,
      quantity: Number(item.quantity),
      timesheet_entry_id: item.time_sheet_entry
        ? item.time_sheet_entry
        : item.timesheet_entry_id,
      _destroy: !!item._destroy,
    }))
  );

  invoiceLineItems = invoiceLineItems.concat(
    manualEntryArr.map(item => ({
      idx: item.id,
      name: item.name,
      description: item.description,
      date: dayjs(item.date).format("DD/MM/YYYY"),
      rate: item.rate,
      quantity: Number(item.quantity),
      timesheet_entry_id: item.time_sheet_entry,
      _destroy: !!item._destroy,
    }))
  );

  return invoiceLineItems;
};

export const getMaxIdx = arr => {
  const ids = arr.map(object => object.idx);

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
  selectedEntries = []
) => {
  if (selectedClient) {
    let selectedEntriesString = "";
    selectedEntries.forEach(entry => {
      if (!entry._destroy) {
        selectedEntriesString += `&selected_entries[]=${entry.timesheet_entry_id}`;
      }
    });

    const queryParams = `client_id=${selectedClient.value}&page=${pageNumber}${selectedEntriesString}`;
    const res = await generateInvoice.getLineItems(queryParams);
    setPageNumber(pageNumber + 1);
    const mergedItems = [...res.data.new_line_item_entries, ...lineItems];
    const sortedData = mergedItems.sort((item1, item2) =>
      dayjs(item1.date).isAfter(dayjs(item2.date)) ? 1 : -1
    );
    setLineItems(sortedData);
    setTotalLineItems(res.data.total_new_line_items);
  }
};

export const fetchMultipleNewLineItems = async (
  setLoading,
  handleFilterParams,
  selectedLineItems,
  setSelectedLineItems,
  setLineItems,
  allCheckboxSelected,
  setTeamMembers
) => {
  const res = await generateInvoice.getLineItems(handleFilterParams());
  const itemSelected = id =>
    selectedLineItems.filter(
      selectedItem => id == selectedItem.timesheet_entry_id
    ).length;

  const items = res.data.new_line_item_entries.map(item => ({
    ...item,
    checked: itemSelected(item.timesheet_entry_id),
    lineTotal: lineTotalCalc(item.quantity, item.rate),
  }));

  const sortedData = [...items].sort((item1, item2) =>
    dayjs(item1.date).isAfter(dayjs(item2.date)) ? 1 : -1
  );
  setLineItems(sortedData);
  if (allCheckboxSelected) {
    setSelectedLineItems(sortedData);
  }
  setTeamMembers(res.data.filter_options.team_members);
  setLoading(false);
};

export const handleDownloadInvoice = async invoice => {
  try {
    const res = await invoicesApi.downloadInvoice(invoice.id);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch {
    Toastr.error("Something went wrong");
  }
};
