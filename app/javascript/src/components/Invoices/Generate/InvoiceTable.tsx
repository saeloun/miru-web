import React, { useEffect, useState, useRef } from "react";

import useOutsideClick from "helpers/outsideClick";

import ManualEntry from "./ManualEntry";
import NewLineItemTable from "./NewLineItemTable";

import TableHeader from "../common/LineItemTableHeader";
import NewLineItemRow from "../common/NewLineItemRow";
import { fetchNewLineItems } from "../common/utils";
import MultipleEntriesModal from "../MultipleEntriesModal";

const InvoiceTable = ({
  currency,
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
      selectedOption
    );
  };

  useOutsideClick(wrapperRef, () => {
    setAddNew(false);
    setPageNumber(1);
    setLineItems([]);
  }, addNew);

  const getNewLineItemDropdown = () => {
    if (selectedClient && lineItems) {
      return <NewLineItemTable
        setShowItemInputs={setShowItemInputs}
        addNew={addNew}
        setAddNew={setAddNew}
        lineItems={lineItems}
        setLineItems={setLineItems}
        loadMoreItems={loadNewLineItems}
        totalLineItems={totalLineItems}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        manualEntryArr={manualEntryArr}
        setManualEntryArr={setManualEntryArr}
        setMultiLineItemModal={setMultiLineItemModal}
        setAddManualLineItem={setAddManualLineItem}
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
                data-cy='new-line-item'
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
              <NewLineItemRow
                key={index}
                currency={currency}
                item={item}
                setSelectedOption={setSelectedOption}
                selectedOption={selectedOption}
                removeElement
              />
            ))}
        </tbody>
      </table>
      <div>
        {showMultiLineItemModal && <MultipleEntriesModal
          selectedClient={selectedClient}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          setMultiLineItemModal={setMultiLineItemModal}
        />}
      </div>
    </React.Fragment>
  );
};

export default InvoiceTable;
