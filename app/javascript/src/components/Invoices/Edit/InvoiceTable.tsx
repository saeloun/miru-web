import React, { useState, useRef } from "react";

import NewLineItemTable from "./NewLineItemTable";
import useOutsideClick from "../../../helpers/outsideClick";
import ManualEntry from "../Generate/ManualEntry";
import NewLineItemRow from "../Generate/NewLineItemRow";
import LineItem from "../Invoice/LineItem";

const InvoiceTable = ({
  lineItems,
  selectedLineItems,
  setLineItems,
  setSelectedLineItems,
  items
}) => {
  const [addNew, setAddNew] = useState<boolean>(false);
  const [manualEntry, setManualEntry] = useState<boolean>(false);

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
        setManualEntry={setManualEntry}
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
    setAddNew(false);
  }, addNew);

  return (
    <React.Fragment>
      <table className="w-full table-fixed">
        <thead className="my-2">
          <tr>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
              NAME
            </th>
            <th className=" px-3 text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
              DATE
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest w-2/5">
              DESCRIPTION
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              RATE
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              QTY
            </th>
            <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
              LINE TOTAL
            </th>
          </tr>
        </thead>
        <tbody className="w-full">
          <tr className="w-full">
            <td colSpan={6} className="py-4 relative">
              {getAddNewButton()}
            </td>
          </tr>
          {manualEntry
            && <ManualEntry
              setShowItemInputs={setManualEntry}
              setSelectedOption={setSelectedLineItems}
              selectedOption={selectedLineItems}
            />
          }
          {
            selectedLineItems.map(item => (
              <NewLineItemRow
                item={item}
              />
            ))}
          {items.length > 0 &&
            items.map((item) => <LineItem key={item.id} item={item} />)}
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default InvoiceTable;
