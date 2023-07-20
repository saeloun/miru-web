import React from "react";

const NewLineItemTableHeader = ({ setShowMultilineModal, setLineItem }) => (
  <div className="flex items-center justify-center px-3 pt-6 pb-2 lg:justify-start">
    <button
      className="hidden text-xs font-bold tracking-widest text-miru-han-purple-1000 lg:inline"
      onClick={() => {
        setShowMultilineModal(true);
        setLineItem({});
      }}
    >
      CLICK TO ADD MULTIPLE ENTRIES
    </button>
    <button
      className="text-xs font-bold tracking-widest text-miru-han-purple-1000 lg:hidden"
      onClick={() => {
        setShowMultilineModal(true);
        setLineItem({});
      }}
    >
      Add multiple entries
    </button>
  </div>
);

export default NewLineItemTableHeader;
