import dayjs from "dayjs";
import { invoiceLineItemsApi, invoicesApi } from "apis/api";
import { lineTotalCalc } from "helpers";
import { Toastr } from "StyledComponents";

const selectedEntryIds = entry =>
  entry.linked_timesheet_entry_ids?.length
    ? entry.linked_timesheet_entry_ids
    : [entry.timesheet_entry_id].filter(Boolean);

const selectionId = item => item.selection_id || item.timesheet_entry_id;

export const generateInvoiceLineItems = (
  selectedLineItems,
  manualEntryArr,
  dateFormat
) => {
  let invoiceLineItems = [];
  invoiceLineItems = invoiceLineItems.concat(
    selectedLineItems.map(item => {
      const Finaldate =
        dateFormat == "DD-MM-YYYY" ? item.date : new Date(item.date);

      return {
        id: item.id,
        name: item.name ? item.name : `${item.first_name} ${item.last_name}`,
        description: item.description,
        date: Finaldate,
        rate: item.rate,
        quantity: Number(item.quantity),
        timesheet_entry_id: item.time_sheet_entry
          ? item.time_sheet_entry
          : item.timesheet_entry_id,
        linked_timesheet_entry_ids: item.linked_timesheet_entry_ids || [],
        _destroy: !!item._destroy,
      };
    })
  );

  invoiceLineItems = invoiceLineItems.concat(
    manualEntryArr.map(item => {
      const Finaldate =
        dateFormat == "DD-MM-YYYY" ? item.date : new Date(item.date);

      return {
        idx: item.id,
        name: item.name,
        description: item.description,
        date: Finaldate,
        rate: item.rate,
        quantity: Number(item.quantity),
        timesheet_entry_id: item.time_sheet_entry,
        _destroy: !!item._destroy,
      };
    })
  );

  return invoiceLineItems;
};

export const fetchNewLineItems = async (
  selectedClient,
  setLineItems,
  selectedEntries = []
) => {
  if (selectedClient) {
    let selectedEntriesString = "";
    selectedEntries.forEach(entry => {
      if (!entry._destroy) {
        selectedEntryIds(entry).forEach(id => {
          selectedEntriesString += `&selected_entries[]=${id}`;
        });
      }
    });
    const queryParams = `client_id=${selectedClient.id}${selectedEntriesString}`;
    const res = await invoiceLineItemsApi.getLineItems(queryParams);
    const mergedItems = [...res.data.new_line_item_entries];
    const sortedData = mergedItems.sort((item1, item2) =>
      dayjs(item1.date).isAfter(dayjs(item2.date)) ? 1 : -1
    );
    setLineItems(sortedData);
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
  const res = await invoiceLineItemsApi.getLineItems(handleFilterParams());
  const itemSelected = id =>
    selectedLineItems.filter(selectedItem => id == selectionId(selectedItem))
      .length;

  const items = res.data.new_line_item_entries.map(item => ({
    ...item,
    checked: itemSelected(selectionId(item)),
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
    const url = window.URL.createObjectURL(new window.Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    const filename = invoice?.invoiceNumber || invoice?.invoice_number;
    link.setAttribute("download", `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
  } catch {
    Toastr.error("Something went wrong");
  }
};
