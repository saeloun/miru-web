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
  setManualEntryArr
}) => {
  const [addNew, setAddNew] = useState<boolean>(false);
  const [showNewLineItemTable, setNewLineItemTable] = useState<boolean>(false);
  const [totalLineItems, setTotalLineItems] = useState<number>(null); //eslint-disable-line
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [showMultiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [isEdit, setEdit] = useState<boolean>(false);
  const [filteredLineItems, setFilteredLineItems] =useState<any>(lineItems);
  const wrapperRef = useRef(null);

  useEffect(() => {
    loadNewLineItems();
  }, [filteredLineItems]);

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

  const addManualEntryItem = () => {
    setAddNew(!addNew);
  };

  useOutsideClick(wrapperRef, () => {
    setNewLineItemTable(false);
    setAddNew(false);
    setEdit(false);
  }, addNew);

  const getNewLineItemDropdown = () => {
    if (selectedClient && lineItems && showNewLineItemTable) {
      return <NewLineItemTable
        setAddNew={setAddNew}
        filteredLineItems={filteredLineItems}
        setFilteredLineItems={setFilteredLineItems}
        loadMoreItems={loadNewLineItems}
        selectedLineItems={selectedLineItems}
        setSelectedLineItems={setSelectedLineItems}
        setMultiLineItemModal={setMultiLineItemModal}
      />;
    }
    return (
      <div className="sm:h-48 h-10 flex items-center justify-center">Please select Client to add line item.</div>
    );
  };

  const getAddNewButton = () => {
    if (!addNew) {
      return <tr className="w-full">
        <td colSpan={6} className="py-4 pr-10 relative">
          <button
            className="py-1 pr-10 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
            onClick={addManualEntryItem}
            data-cy="new-line-item"
          >
        + NEW LINE ITEM
          </button>
        </td>
      </tr>;
    }
  };

  return (
    <Fragment>
      <table className="w-128 sm:w-full table-fixed bg-miru-han-1000">
        <LineItemTableHeader />
        <tbody className="w-full" ref={wrapperRef}>
          {getAddNewButton()}
          {
            addNew
            &&
              <ManualEntry
                manualEntryArr={manualEntryArr}
                setManualEntryArr={setManualEntryArr}
                setNewLineItemTable={setNewLineItemTable}
                getNewLineItemDropdown={getNewLineItemDropdown}
                addNew={addNew}
                setAddNew={setAddNew}
                showNewLineItemTable={showNewLineItemTable}
                lineItems={lineItems}
                filteredLineItems={filteredLineItems}
                setFilteredLineItems={setFilteredLineItems}
              />

          }
          {
            manualEntryArr[0]?.name
            && manualEntryArr.map((item, index) => (
              !item._destroy &&
              <NewLineItemRow
                key={index}
                currency={currency}
                item={item}
                selectedOption={manualEntryArr}
                setSelectedOption={setManualEntryArr}
                isEdit={isEdit}
                setEdit={setEdit}
              />
            ))
          }
          {
            selectedLineItems.length > 0
            && selectedLineItems.map((item, index) => (
              !item._destroy &&
              <NewLineItemRow
                key={index}
                currency={currency}
                item={item}
                selectedOption={selectedLineItems}
                setSelectedOption={setSelectedLineItems}
                isEdit={isEdit}
                setEdit={setEdit}
              />
            ))
          }
        </tbody>
      </table>
      <div>
        {showMultiLineItemModal && <MultipleEntriesModal
          selectedClient={selectedClient}
          selectedOption={selectedLineItems}
          setSelectedOption={setSelectedLineItems}
          setMultiLineItemModal={setMultiLineItemModal}
        />}
      </div>
    </Fragment>
  );
};

export default InvoiceTable;
