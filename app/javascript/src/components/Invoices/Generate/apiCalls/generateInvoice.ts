import generateInvoice from "apis/generateInvoice";

const fetchNewLineItems = async (
  selectedClient,
  setLineItems,
  lineItems,
  setTotalLineItems,
  pageNumber,
  setPageNumber,
  tableDataSet = (lineItems) => {},
  selectedEntries = [],
) => {
  if (selectedClient) {
    let selectedEntriesString = "";
    selectedEntries.forEach((entries) => {
      selectedEntriesString += `&selected_entries[]=${entries.timesheet_entry_id}`;
    });
    return await generateInvoice.getLineItems(selectedClient.value, pageNumber, selectedEntriesString)
  }
};

export default fetchNewLineItems;
