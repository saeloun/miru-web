import React, { Fragment, useEffect, useState, useRef } from "react";

import { useOutsideClick } from "helpers";

import MultipleEntriesModal from "../../MultipleEntriesModal";
import LineItemTableHeader from "../LineItemTableHeader";
import ManualEntry from "../ManualEntry";
import NewLineItemRow from "../NewLineItemRow";
import NewLineItemTable from "../NewLineItemTable";
import { fetchNewLineItems } from "../utils";

const InvoiceTable = ({
  currency,
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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [multiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [filteredLineItems, setFilteredLineItems] = useState<any>(lineItems);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setFilteredLineItems(lineItems);
  }, [lineItems]);

  const loadNewLineItems = () => {
    fetchNewLineItems(
      selectedClient,
      lineItems,
      setLineItems,
      pageNumber,
      setPageNumber,
      selectedLineItems
    );
  };

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
          filteredLineItems={filteredLineItems}
          loadMoreItems={loadNewLineItems}
          selectedLineItems={selectedLineItems}
          setAddNew={setAddNew}
          setFilteredLineItems={setFilteredLineItems}
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
        <tr className="w-full">
          <td className="relative py-4 pr-10" colSpan={6}>
            <button
              className="w-full rounded-md border-2 border-dashed border-miru-dark-purple-200 bg-white py-1 pr-10 text-center text-base font-bold tracking-widest text-miru-dark-purple-200"
              data-cy="new-line-item"
              onClick={() => setAddNew(!addNew)}
            >
              + NEW LINE ITEM
            </button>
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
          filteredLineItems={filteredLineItems}
          getNewLineItemDropdown={getNewLineItemDropdown}
          lineItems={lineItems}
          manualEntryArr={manualEntryArr}
          setAddNew={setAddNew}
          setFilteredLineItems={setFilteredLineItems}
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
                    currency={currency}
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
                    currency={currency}
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
