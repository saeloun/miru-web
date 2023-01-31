import React, { useState, useRef } from "react";

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
  isDesktop,
  setFilterParams,
  selectedInvoiceCount,
  setShowBulkDeleteDialog,
  setShowBulkDownloadDialog,
}) => {
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  return (
    <div className="mb-4 flex w-full flex-wrap items-center justify-between">
      <div className="flex items-center justify-start">
        <h1 className="text-base font-semibold text-miru-dark-purple-1000 lg:text-2xl lg:font-normal">
          All Invoices
        </h1>
        {isDesktop && (
          <AppliedFilters
            filterIntialValues={filterIntialValues}
            filterParams={filterParams}
            filterParamsStr={filterParamsStr}
            setFilterParams={setFilterParams}
          />
        )}
      </div>
      <div className="relative" ref={wrapperRef}>
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
            className="right-0"
            setVisibilty={setIsMoreOptionsOpen}
            wrapperRef={wrapperRef}
          >
            <li
              className="flex cursor-pointer items-center py-2.5 px-4 text-xs font-medium text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:text-sm"
              onClick={() => {
                setShowBulkDownloadDialog(true);
                setIsMoreOptionsOpen(false);
              }}
            >
              <DownloadSimpleIcon className="mr-2" size={16} weight="bold" />{" "}
              Download
            </li>
            <li
              className="flex cursor-pointer items-center py-2.5 px-4 text-xs font-medium text-miru-red-400 hover:bg-miru-gray-100 lg:text-sm"
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
