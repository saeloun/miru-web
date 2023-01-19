import React, { useRef, useState } from "react";

import { DeleteIcon, DownloadSimpleIcon } from "miruIcons";
import { MoreOptions } from "StyledComponents";

import AppliedFilters from "./AppliedFilters";
import BulkActions from "./BulkActions";

const BulkActionsWrapper = ({
  clearCheckboxes,
  filterParams,
  filterParamsStr,
  filterIntialValues,
  isInvoiceSelected,
  downloading,
  setFilterParams,
  selectedInvoiceCount,
  setShowBulkDeleteDialog,
  setShowBulkDownloadDialog,
}) => {
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  return (
    <div className="mb-4 flex w-full flex-wrap items-center justify-between">
      <div className="flex flex-col items-start justify-start lg:flex-row lg:items-center">
        <h1 className="text-2xl font-normal text-miru-dark-purple-1000">
          All Invoices
        </h1>
        <AppliedFilters
          filterIntialValues={filterIntialValues}
          filterParams={filterParams}
          filterParamsStr={filterParamsStr}
          setFilterParams={setFilterParams}
        />
      </div>
      <div ref={wrapperRef}>
        <BulkActions
          clearCheckboxes={clearCheckboxes}
          downloading={downloading}
          isInvoiceSelected={isInvoiceSelected}
          isMoreOptionsOpen={isMoreOptionsOpen}
          selectedInvoiceCount={selectedInvoiceCount}
          setIsMoreOptionsOpen={setIsMoreOptionsOpen}
        />
        {isMoreOptionsOpen && (
          <MoreOptions
            setVisibilty={setIsMoreOptionsOpen}
            wrapperRef={wrapperRef}
          >
            <li
              className="flex cursor-pointer items-center py-2.5 px-4 text-miru-han-purple-1000 hover:bg-miru-gray-100"
              onClick={() => {
                setShowBulkDownloadDialog(true);
                setIsMoreOptionsOpen(false);
              }}
            >
              <DownloadSimpleIcon className="mr-2" size={16} weight="bold" />{" "}
              Download
            </li>
            <li
              className="flex cursor-pointer items-center py-2.5 px-4 text-miru-red-400 hover:bg-miru-gray-100"
              onClick={() => {
                setShowBulkDeleteDialog(true);
              }}
            >
              <DeleteIcon className="mr-2" size={16} weight="bold" /> Delete
            </li>
          </MoreOptions>
        )}
      </div>
    </div>
  );
};

export default BulkActionsWrapper;
