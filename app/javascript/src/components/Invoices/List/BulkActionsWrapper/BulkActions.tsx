import React, { useState } from "react";

import { CaretDownIcon, XIcon } from "miruIcons";

const BulkActions = ({
  clearCheckboxes,
  isInvoiceSelected,
  isMoreOptionsOpen,
  downloading,
  selectedInvoiceCount,
  setIsMoreOptionsOpen,
}) => {
  const [hover, setHover] = useState(false);
  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  return (
    isInvoiceSelected && (
      <div className="flex items-center justify-end">
        <span className="text-xs font-semibold leading-4 text-miru-dark-purple-1000 lg:text-sm lg:leading-5">
          {selectedInvoiceCount > 1
            ? `${selectedInvoiceCount} invoices selected`
            : `${selectedInvoiceCount} invoice selected`}
        </span>
        <button
          className="ml-2 p-1 hover:bg-miru-gray-100 lg:ml-4"
          onClick={clearCheckboxes}
        >
          <XIcon color="#5b34ea" size={16} weight="bold" />
        </button>
        <div
          className="ml-2 cursor-pointer rounded px-2 py-1 lg:ml-4 lg:px-6 lg:py-2"
          style={{
            background: hover && "rgba(205,214,223, 0.2)",
            border: "1px solid rgba(91, 52, 234, .2)",
          }}
          onMouseEnter={handleMouseEnter} // Or onMouseOver
          onMouseLeave={handleMouseLeave}
        >
          <button
            disabled={downloading}
            className={`flex items-center text-xs font-bold leading-4 opacity-100 lg:text-base lg:leading-5 ${
              downloading ? "text-miru-gray-1000" : "text-miru-han-purple-1000"
            }`}
            onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
          >
            <span className="mr-2.5">Actions</span>
            <CaretDownIcon className="font-bold" size={18} weight="bold" />
          </button>
        </div>
      </div>
    )
  );
};

export default BulkActions;
