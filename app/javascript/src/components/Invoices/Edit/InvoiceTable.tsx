import React, { useState, useRef } from "react";

import useOutsideClick from "helpers/outsideClick";
import NewLineItemTable from "./NewLineItemTable";
import TableHeader from "../common/LineItemTableHeader";
import NewLineItemRow from "../common/NewLineItemRow";
import ManualEntry from "../Generate/ManualEntry";

const InvoiceTable = ({
  lineItems,
  selectedLineItems,
  setLineItems,
  setSelectedLineItems,
  manualEntryArr,
  setManualEntryArr
}) => {
  const [addNew, setAddNew] = useState<boolean>(false);

  const wrapperRef = useRef(null);

  const getNewLineItemDropdown = () => {
    if (lineItems) {
      return <NewLineItemTable
        lineItems={lineItems}
        setLineItems={setLineItems}
        selectedLineItems={selectedLineItems}
        setSelectedLineItems={setSelectedLineItems}
        addNew={addNew}
        setAddNew={setAddNew}
        manualEntryArr={manualEntryArr}
        setManualEntryArr={setManualEntryArr}
      />;
    }
    return (
      <div className="h-48 flex items-center justify-center">Please select Client to add line item.</div>
    );
  };

  const getAddNewButton = () => {
    if (addNew) {
      return <div ref={wrapperRef} className="box-shadow rounded absolute m-0 font-medium text-sm text-miru-dark-purple-1000 bg-white top-0 w-full">
        {getNewLineItemDropdown()}
      </div>;
    } else {
      return <button
        className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed"
        onClick={() => {
          setAddNew(!addNew);
        }}
      >
        + NEW LINE ITEM
      </button>;
    }
  };

  useOutsideClick(wrapperRef, () => {
    setAddNew(addNew);
  }, addNew);

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <TableHeader />
        <tbody className="w-full">
          <tr className="w-full">
            <td colSpan={6} className="py-4 relative">
              {getAddNewButton()}
            </td>
          </tr>
          {manualEntryArr.map((entry) =>
            <ManualEntry
              entry={entry}
              manualEntryArr={manualEntryArr}
              setManualEntryArr={setManualEntryArr}
            />
          )
          }
          {
            selectedLineItems.map((item, index) => (
              <NewLineItemRow
                item={item}
                selectedOption={selectedLineItems}
                setSelectedOption={setSelectedLineItems}
                key={index}
              />
            ))}
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default InvoiceTable;
