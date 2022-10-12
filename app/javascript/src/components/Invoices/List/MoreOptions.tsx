import React from "react";

import { useDebounce } from "helpers";
import { PaperPlaneTilt, Trash, Printer } from "phosphor-react";

const MoreOptions = ({
  isMenuOpen,
  setIsMenuOpen,
  setShowDeleteDialog,
  setInvoiceToDelete,
  invoice
}) => {
  useDebounce(isMenuOpen, 500);

  return (
    <div
      onMouseLeave={() => setIsMenuOpen(false)}
      className="group-hover:flex flex-col items-end z-10 absolute top-4 right-5"
    >
      <div className="w-12 overflow-hidden">
        <div className="h-6 w-6 bg-white border-2 border-miru-gray-200 rotate-45 transform origin-bottom-left"></div>
      </div>
      <ul className="p-4 bg-white border-2 border-t-0 border-miru-gray-200">
        <li className="flex items-center py-1 cursor-pointer">
          <Printer size={16} className="mr-4 text-miru-han-purple-1000" />
          Print
        </li>
        <li
          onClick={() => {
            setShowDeleteDialog(true);
            setInvoiceToDelete(invoice.id);
          }}
          className="flex items-center py-1 cursor-pointer"
        >
          <Trash size={16} className="mr-4 text-miru-han-purple-1000" />
          Delete
        </li>
        <li className="flex items-center py-1 cursor-pointer">
          <PaperPlaneTilt
            size={16}
            className="mr-4 text-miru-han-purple-1000"
          />
          Send via link
        </li>
      </ul>
    </div>
  );
};

export default MoreOptions;
