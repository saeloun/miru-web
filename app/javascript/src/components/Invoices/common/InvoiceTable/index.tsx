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
  const [showItemInputs, setShowItemInputs] = useState<boolean>(false);
  const [totalLineItems, setTotalLineItems] = useState<number>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [multiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [addManualLineItem, setAddManualLineItem] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (addManualLineItem) return setAddManualLineItem(false);

    if (addNew) {
      loadNewLineItems();
    }
  }, [addNew]);

  const loadNewLineItems = () => {
    fetchNewLineItems(
      selectedClient,
      lineItems,
      setLineItems,
      setTotalLineItems,
      pageNumber,
      setPageNumber,
      selectedLineItems
    );
  };

  useOutsideClick(
    wrapperRef,
    () => {
      setAddNew(false);
      setPageNumber(1);
      setLineItems([]);
    },
    addNew
  );

  const getNewLineItemDropdown = () => {
    if (selectedClient && lineItems) {
      return (
        <NewLineItemTable
          addNew={addNew}
          lineItems={lineItems}
          loadMoreItems={loadNewLineItems}
          manualEntryArr={manualEntryArr}
          pageNumber={pageNumber}
          selectedLineItems={selectedLineItems}
          setAddManualLineItem={setAddManualLineItem}
          setAddNew={setAddNew}
          setLineItems={setLineItems}
          setManualEntryArr={setManualEntryArr}
          setMultiLineItemModal={setMultiLineItemModal}
          setPageNumber={setPageNumber}
          setSelectedLineItems={setSelectedLineItems}
          setShowItemInputs={setShowItemInputs}
          totalLineItems={totalLineItems}
        />
      );
    }

    return (
      <div className="flex h-48 items-center justify-center">
        Please select Client to add line item.
      </div>
    );
  };

  const getAddNewButton = () => {
    if (addNew) {
      return (
        <div
          className="box-shadow absolute top-0 m-0 w-full rounded bg-white text-sm font-medium text-miru-dark-purple-1000"
          ref={wrapperRef}
        >
          {getNewLineItemDropdown()}
        </div>
      );
    }

    return (
      <button
        className=" w-full rounded-md border-2 border-dashed border-miru-dark-purple-200 bg-white py-1 text-center text-base font-bold tracking-widest text-miru-dark-purple-200"
        data-cy="new-line-item"
        onClick={() => {
          setAddNew(!addNew);
        }}
      >
        + NEW LINE ITEM
      </button>
    );
  };

  return (
    <Fragment>
      <table className="w-full table-fixed">
        <LineItemTableHeader />
        <tbody className="w-full">
          <tr className="w-full">
            <td className="relative py-4" colSpan={6}>
              {getAddNewButton()}
            </td>
          </tr>
          {showItemInputs &&
            manualEntryArr.map((entry, index) => (
              <ManualEntry
                entry={entry}
                key={index}
                manualEntryArr={manualEntryArr}
                setManualEntryArr={setManualEntryArr}
              />
            ))}
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
