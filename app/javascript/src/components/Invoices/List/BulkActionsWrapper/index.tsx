import React, { useState } from "react";
import { DeleteIcon, DownloadSimpleIcon } from "miruIcons";

import AppliedFilters from "./AppliedFilters";
import BulkActions from "./BulkActions";
import { MoreOptions } from "StyledComponents";

const BulkActionsWrapper = ({
  filterParams,
  filterParamsStr,
  setFilterParams,
  filterIntialValues,
  isInvoiceSelected,
  selectedInvoiceCount,
  setShowBulkDeleteDialog,
  setShowBulkDownloadDialog,
  clearCheckboxes,
}) => {
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState<boolean>(false);

  return (
    <div className="mb-4 flex w-full items-center justify-between">
      <div className="flex flex-col items-start justify-start lg:flex-row lg:items-center">
        <h1 className="text-2xl font-normal text-miru-dark-purple-1000">
          All Invoices
        </h1>
        <AppliedFilters
          filterParams={filterParams}
          filterParamsStr={filterParamsStr}
          setFilterParams={setFilterParams}
          filterIntialValues={filterIntialValues}
        />
      </div>
      <div>
        <BulkActions
          isInvoiceSelected={isInvoiceSelected}
          selectedInvoiceCount={selectedInvoiceCount}
          clearCheckboxes={clearCheckboxes}
          isMoreOptionsOpen={isMoreOptionsOpen}
          setIsMoreOptionsOpen={setIsMoreOptionsOpen}
        />
        {isMoreOptionsOpen && (
          <MoreOptions setVisibilty={setIsMoreOptionsOpen}>
            <li
              onClick={() => {
                setShowBulkDownloadDialog(true);
                setIsMoreOptionsOpen(false);
              }}
              className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
            >
              <DownloadSimpleIcon className="mr-4" size={16} /> Download
            </li>
            <li
              onClick={() => {
                setShowBulkDeleteDialog(true);
              }}
              className="flex cursor-pointer items-center py-2.5 px-4 text-miru-red-400 hover:bg-miru-gray-100"
            >
              <DeleteIcon className="mr-4" size={16} /> Delete
            </li>
          </MoreOptions>
        )}
      </div>
    </div>
  );
};

export default BulkActionsWrapper;
