import React, { useEffect, useState, useRef } from "react";
import generateInvoice from "apis/generateInvoice";

import dayjs from "dayjs";
import ManualEntry from "./ManualEntry";
import NewLineItemTable from "./NewLineItemTable";

import useOutsideClick from "../../../helpers/outsideClick";
import TableHeader from "../common/LineItemTableHeader";
import NewLineItemRows from "../common/NewLineItemRow";
import MultipleEntriesModal from "../MultipleEntriesModal";

const fetchNewLineItems = async (
  selectedClient,
  setLineItems,
  lineItems,
  setTotalLineItems,
  pageNumber,
  setPageNumber,
  selectedEntries = [],
) => {
  if (selectedClient) {
    let selectedEntriesString = "";
    selectedEntries.forEach((entries) => {
      selectedEntriesString += `&selected_entries[]=${entries.timesheet_entry_id}`;
    });

    await generateInvoice.getLineItems(selectedClient.value, pageNumber, selectedEntriesString).then(async res => {
      await setTotalLineItems(res.data.pagy.count);
      await setPageNumber(pageNumber + 1);
      const mergedItems = [...res.data.new_line_item_entries, ...lineItems];
      const sortedData = mergedItems.sort((item1, item2) => dayjs(item1.date).isAfter(dayjs(item2.date)) ? 1 : -1);
      await setLineItems(sortedData);
    });
  }
};

const InvoiceTable = ({
  selectedClient,
  setSelectedOption,
  selectedOption,
  lineItems,
  setLineItems,
  manualEntryArr,
  setManualEntryArr
}) => {

  const [addNew, setAddNew] = useState<boolean>(false);
  const [showItemInputs, setShowItemInputs] = useState<boolean>(false);
  const [totalLineItems, setTotalLineItems] = useState<number>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [showMultiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (addNew) {
      fetchNewLineItems(selectedClient, setLineItems, lineItems, setTotalLineItems, pageNumber, setPageNumber, selectedOption);
    }
  }, [addNew]);

  const loadMoreItems = () => {
    fetchNewLineItems(selectedClient, setLineItems, lineItems, setTotalLineItems, pageNumber, setPageNumber, selectedOption);
  };

  useOutsideClick(wrapperRef, () => {
    setAddNew(false);
    setPageNumber(1);
    setLineItems([]);
  }, addNew);

  const getNewLineItemDropdown = () => {
    if (selectedClient && lineItems) {
      return <NewLineItemTable
        showItemInputs={showItemInputs}
        setShowItemInputs={setShowItemInputs}
        addNew={addNew}
        setAddNew={setAddNew}
        lineItems={lineItems}
        setLineItems={setLineItems}
        loadMoreItems={loadMoreItems}
        totalLineItems={totalLineItems}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        setSelectedOption={setSelectedOption}
        selectedOption={selectedOption}
        setMultiLineItemModal={setMultiLineItemModal}
        manualEntryArr={manualEntryArr}
        setManualEntryArr={setManualEntryArr}
      />;
    }
    return (
      <div className="h-48 flex items-center justify-center">Please select Client to add line item.</div>
    );
  };

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <TableHeader />
        <tbody className="w-full">
          <tr className="w-full ">
            <td colSpan={6} className="py-4 relative">
              {
                addNew && <div ref={wrapperRef} className="box-shadow z-10 rounded absolute m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white top-0 w-full">
                  {getNewLineItemDropdown()}
                </div>
              }
              <button
                className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
                onClick={() => {
                  setAddNew(!addNew);
                }}
              >
                + NEW LINE ITEM
              </button>
            </td>
          </tr>
          {
            showItemInputs
            && (manualEntryArr.map((entry) =>
              <ManualEntry
                entry={entry}
                manualEntryArr={manualEntryArr}
                setManualEntryArr={setManualEntryArr}
              />
            ))
          }
          {selectedOption.length > 0
            && selectedOption.map((item, index) => (
              <NewLineItemRows
                item={item}
                key={index}
                setSelectedOption={setSelectedOption}
                selectedOption={selectedOption}
              />
            ))}
        </tbody>
      </table>
      <div>
        {showMultiLineItemModal && <MultipleEntriesModal
          selectedClient={selectedClient}
          setSelectedOption={setSelectedOption}
          selectedOption={selectedOption}
          setMultiLineItemModal={setMultiLineItemModal}
        />}
      </div>
    </React.Fragment>
  );
};

export default InvoiceTable;
