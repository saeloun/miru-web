import React from "react";

const NewLineItemTableHeader = ({ setShowMultilineModal, setLineItem }) => (
  <div className="flex items-center justify-between px-3 pt-6 pb-2">
    <button
      className="text-xs font-bold tracking-widest text-miru-han-purple-1000"
      onClick={() => {
        setShowMultilineModal(true);
        setLineItem({});
      }}
    >
      CLICK TO ADD MULTIPLE ENTRIES
    </button>
  </div>
);

export default NewLineItemTableHeader;
