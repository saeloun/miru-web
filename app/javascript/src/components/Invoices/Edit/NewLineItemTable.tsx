import React from "react";
import { DropdownHeader } from "../Generate/CustomComponents";

const NewLineItemTable = ({
  lineItems, setLineItems,
  selectedLineItems, setSelectedLineItems,
  addNew, setAddNew, setManualEntry
}) => {

  const renderLineItem = (item) => (
    <div onClick = {() => {selectRowId(item);}} className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100">
      <span className="font-medium text-base text-miru-dark-purple-1000 text-left">
        {item.first_name} {item.last_name}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-600 text-left w-1/2">
        {item.description}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
        {item.date}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
          ${item.rate}
      </span>
    </div>
  );

  const selectRowId = (items) => {
    // const option = { ...items, lineTotal: (Number(items.qty)/60 * Number(items.rate)) };
    setAddNew(false);
  };

  return (
    <div>
      <DropdownHeader />
      <div>
        <button
          onClick={() => {
            setAddNew(!addNew);
            setManualEntry(true);
          }}
          className="mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000"
        >
          Add Manual Entry
        </button>
      </div>
      <div className="overflow-scroll mt-4 relative">
        { lineItems.map(item => renderLineItem(item)) }
      </div>
    </div>
  );
};

export default NewLineItemTable;
