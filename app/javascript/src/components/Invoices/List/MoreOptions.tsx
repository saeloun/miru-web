import React from "react";

import { useDebounce } from "helpers";
import { PaperPlaneTiltIcon, DeleteIcon, PrinterIcon } from "miruIcons";

const MoreOptions = ({
  isMenuOpen,
  setIsMenuOpen,
  setShowDeleteDialog,
  setInvoiceToDelete,
  invoice,
}) => {
  useDebounce(isMenuOpen, 500);

  return (
    <div
      className="absolute top-4 right-5 z-10 flex-col items-end group-hover:flex"
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div className="w-12 overflow-hidden">
        <div className="h-6 w-6 origin-bottom-left rotate-45 transform border-2 border-miru-gray-200 bg-white" />
      </div>
      <ul className="border-2 border-t-0 border-miru-gray-200 bg-white p-4">
        <li className="flex cursor-pointer items-center py-1">
          <PrinterIcon className="mr-4 text-miru-han-purple-1000" size={16} />
          Print
        </li>
        <li
          className="flex cursor-pointer items-center py-1"
          onClick={() => {
            setShowDeleteDialog(true);
            setInvoiceToDelete(invoice.id);
          }}
        >
          <DeleteIcon className="mr-4 text-miru-han-purple-1000" size={16} />
          Delete
        </li>
        <li className="flex cursor-pointer items-center py-1">
          <PaperPlaneTiltIcon
            className="mr-4 text-miru-han-purple-1000"
            size={16}
          />
          Send via link
        </li>
      </ul>
    </div>
  );
};

export default MoreOptions;
