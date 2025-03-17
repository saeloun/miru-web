import React, { Fragment, useEffect, useState, useRef } from "react";

import { useOutsideClick, useDebounce } from "helpers";

import MultipleEntriesModal from "../../MultipleEntriesModal";
import LineItemTableHeader from "../LineItemTableHeader";
import ManualEntry from "../ManualEntry";
import NewLineItemRow from "../NewLineItemRow";
import NewLineItemTable from "../NewLineItemTable";
import { fetchNewLineItems } from "../utils";

const InvoiceTable = ({
  currency,
  clientCurrency,
  dateFormat,
  selectedClient,
  lineItems,
  setLineItems,
  selectedLineItems,
  setSelectedLineItems,
  manualEntryArr,
  setManualEntryArr,
}) => {
  const [addNew, setAddNew] = useState<boolean>(false);
  const [showNewLineItemTable, setShowNewLineItemTable] =
    useState<boolean>(false);
  const [multiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [filteredLineItems, setFilteredLineItems] = useState<any>();
  const [lineItem, setLineItem] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const wrapperRef = useRef(null);
  const debouncedSearchName = useDebounce(lineItem.name, 500);

  const loadNewLineItems = () => {
    fetchNewLineItems(selectedClient, setLineItems, selectedLineItems);
  };

  useEffect(() => {
    if (debouncedSearchName) {
      const newLineItems = lineItems.filter(item =>
        item.first_name
          .toLowerCase()
          .includes(debouncedSearchName.toLowerCase())
      );
      setFilteredLineItems(newLineItems);
      setLoading(false);
    } else {
      setFilteredLineItems(lineItems);
      setLoading(false);
    }
  }, [debouncedSearchName, lineItems]);

  const handleAddEntry = () => {
    if (!addNew && lineItem.name) {
      if (!lineItem.date) {
        lineItem.date = new Date().toISOString();
      }
      setManualEntryArr([...manualEntryArr, lineItem]);
    }
  };

  useEffect(() => handleAddEntry(), [addNew]);

  useOutsideClick(
    wrapperRef,
    () => {
      setShowNewLineItemTable(false);
      setAddNew(false);
    },
    addNew
  );

  const getNewLineItemDropdown = () => {
    if (selectedClient && lineItems && showNewLineItemTable) {
      return (
        <NewLineItemTable
          dateFormat={dateFormat}
          filteredLineItems={filteredLineItems}
          loadMoreItems={loadNewLineItems}
          loading={loading}
          selectedLineItems={selectedLineItems}
          setAddNew={setAddNew}
          setFilteredLineItems={setFilteredLineItems}
          setLineItem={setLineItem}
          setLoading={setLoading}
          setMultiLineItemModal={setMultiLineItemModal}
          setSelectedLineItems={setSelectedLineItems}
        />
      );
    }

    return (
      <div className="flex h-10 items-center justify-center sm:h-48">
        Please select Client to add line item.
      </div>
    );
  };

  const getAddNewButton = () => {
    if (!addNew) {
      return (
        <tr className="w-full pt-4">
          <td className="relative w-full pt-4 pr-10" colSpan={6}>
            <button
              disabled={!selectedClient}
              className={`hoverButton w-full rounded-md border-2 border-dashed  bg-white py-1 pr-10 text-center text-base font-bold tracking-widest ${
                selectedClient
                  ? "border-miru-dark-purple-200 text-miru-dark-purple-200"
                  : "border-miru-dark-purple-100 text-miru-dark-purple-100"
              }`}
              onClick={() => setAddNew(!addNew)}
            >
              + NEW LINE ITEM
            </button>
            {!selectedClient && (
              <span className="invisible absolute top-full left-1/3 ml-10 rounded bg-miru-dark-purple-1000 p-2 text-sm font-bold text-miru-dark-purple-100">
                Please add client before adding line items
              </span>
            )}
          </td>
        </tr>
      );
    }
  };

  const getManualEntryItem = () => {
    if (selectedClient) {
      return (
        <ManualEntry
          addNew={addNew}
          dateFormat={dateFormat}
          getNewLineItemDropdown={getNewLineItemDropdown}
          lineItem={lineItem}
          manualEntryArr={manualEntryArr}
          setAddNew={setAddNew}
          setLineItem={setLineItem}
          setManualEntryArr={setManualEntryArr}
          setNewLineItemTable={setShowNewLineItemTable}
          showNewLineItemTable={showNewLineItemTable}
        />
      );
    }

    return (
      <tr>
        <td colSpan={5}>
          <div className="shadow-2 mt-4 flex h-10 w-full items-center justify-center bg-white sm:h-48">
            Please select Client to add line item.
          </div>
        </td>
      </tr>
    );
  };

  return (
    <Fragment>
      <table className="bg-miru-han-1000 w-128 table-fixed sm:w-full">
        <LineItemTableHeader />
        <tbody className="w-full" ref={wrapperRef}>
          {getAddNewButton()}
          {addNew && getManualEntryItem()}
          {manualEntryArr[0]?.name &&
            manualEntryArr.map(
              (item, index) =>
                !item._destroy && (
                  <NewLineItemRow
                    clientCurrency={clientCurrency}
                    currency={currency}
                    dateFormat={dateFormat}
                    item={item}
                    key={index}
                    selectedOption={manualEntryArr}
                    setSelectedOption={setManualEntryArr}
                  />
                )
            )}
          {selectedLineItems.length > 0 &&
            selectedLineItems.map(
              (item, index) =>
                !item._destroy && (
                  <NewLineItemRow
                    clientCurrency={clientCurrency}
                    currency={currency}
                    dateFormat={dateFormat}
                    item={item}
                    key={index}
                    selectedOption={selectedLineItems}
                    setSelectedOption={setSelectedLineItems}
                  />
                )
            )}
        </tbody>
      </table>
      <div>
        {multiLineItemModal && (
          <MultipleEntriesModal
            dateFormat={dateFormat}
            selectedClient={selectedClient}
            selectedOption={selectedLineItems}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedOption={setSelectedLineItems}
          />
        )}
      </div>
    </Fragment>
  );
};

export default InvoiceTable;
