import React from "react";

import { formattedDate } from "helpers/formattedDate";

import { getMaxIdx } from "../common/utils";
const NewLineItemTable = ({
  lineItems, setLineItems,
  selectedLineItems, setSelectedLineItems,
  addNew, setAddNew, manualEntryArr, setManualEntryArr
}) => {

  const selectRowId = (item) => {
    const option = { ...item, lineTotal: (Number(item.qty)/60 * Number(item.rate)) };
    const newLineItems = [...lineItems];
    newLineItems.splice(item.key, 1);

    setAddNew(false);
    setSelectedLineItems([...selectedLineItems, option]);
    setLineItems(newLineItems);
  };

  const renderLineItem = (item) => (
    <div onClick = {() => {selectRowId(item);}} className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100">
      <span className="font-medium text-base text-miru-dark-purple-1000 text-left">
        {item.first_name} {item.last_name}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-600 text-left w-1/2">
        {item.description}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
        {formattedDate(item.date)}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-center">
          ${item.rate}
      </span>
    </div>
  );

  return (
    <div>
      <div>
        <button
          onClick={() => {
            setAddNew(!addNew);
            setManualEntryArr([...manualEntryArr, { idx: getMaxIdx(manualEntryArr) + 1 }]);
          }}
          className="mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000"
        >
          Add Manual Entry
        </button>
      </div>
      <div className="overflow-y-scroll h-80 mt-4 relative" data-cy ="entries-list-edit">
        { lineItems.map(item => renderLineItem(item)) }
      </div>
    </div>
  );
};

export default NewLineItemTable;
