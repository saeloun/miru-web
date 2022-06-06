import React from "react";

const NewLineItemTable = ({
  lineItems, setLineItems,
  selectedLineItems, setSelectedLineItems,
  // addNew,
  setAddNew,
  // setManualEntry
}) => {

  const selectRowId = (item) => {
    const option = { ...item };
    const newLineItems = [...lineItems];
    newLineItems.splice(item.key, 1);

    setAddNew(false);
    setSelectedLineItems([...selectedLineItems, option]);
    setLineItems(newLineItems);
  };

  const renderLineItem = (item) => (
    <div onClick = {() => {selectRowId(item);}} className="py-2 px-3 flex justify-between cursor-pointer hover:bg-miru-gray-100">
      <span className="font-medium text-base text-miru-dark-purple-1000 text-left">
        {item.name}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-left">
        {item.description}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-left">
        {item.kind_name}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-right">
        {item.number_of_resource}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-right">
        {item.resource_expertise_level}
      </span>
      <span className="font-medium text-xs text-miru-dark-purple-1000 text-right">
        {item.price}
      </span>
    </div>
  );

  return (
    <div>
      <div>
        {/* <button
          onClick={() => {
            setAddNew(!addNew);
            setManualEntry(true);
          }}
          className="mx-3 font-bold text-xs tracking-widest text-miru-han-purple-1000"
        >
          Add Manual Entry
        </button> */}
      </div>
      <div className="overflow-y-scroll h-80 mt-4 relative">
        { lineItems.map(item => renderLineItem(item)) }
      </div>
    </div>
  );
};

export default NewLineItemTable;
