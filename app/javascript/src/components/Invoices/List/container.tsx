import React, { useState, useEffect } from "react";

import { XIcon } from "miruIcons";

import RecentlyUpdated from "./RecentlyUpdated";
import Table from "./Table";

import InvoiceSummary from "../InvoiceSummary";

const Container = ({
  summary,
  invoices,
  selectedInvoices,
  recentlyUpdatedInvoices,
  selectInvoices,
  deselectInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete,
  filterParams,
  setFilterParams,
  filterIntialValues,
  filterParamsStr,
  fetchInvoices,
  isDesktop,
}) => {
  let appliedFilterCount = (filterParamsStr.match(/&/g) || []).length;
  const [loading, setLoading] = useState<boolean>(false);
  filterParamsStr.includes("custom") &&
    (appliedFilterCount = appliedFilterCount - 2);

  const handleRemoveFilter = removeval => {
    let name, newArr;
    for (const [key, value] of Object.entries(filterParams)) {
      Array.isArray(value)
        ? value.map(v => {
            if (v == removeval) {
              name = key;
              newArr = value.filter(v => v != removeval);
            }
          })
        : value == removeval &&
          ((name = key), (newArr = filterIntialValues.dateRange));
    }

    setFilterParams({
      ...filterParams,
      [name]: newArr,
    });
  };

  useEffect(() => setLoading(true), []);

  useEffect(() => setLoading(false), [invoices]);

  return loading ? (
    <p className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000">
      Loading...
    </p>
  ) : invoices.length > 0 ? (
    <div
      className={`${
        isDesktop ? null : "overflow-x-scroll"
      } flex flex-col items-stretch`}
    >
      <InvoiceSummary
        baseCurrency={invoices[0].company.baseCurrency}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
        summary={summary}
      />
      <div className="my-20">
        <h1 className="mb-4 text-2xl font-normal text-miru-dark-purple-1000">
          Recently updated
        </h1>
        <div className="grid grid-cols-10 gap-44 overflow-x-auto overflow-y-hidden">
          {recentlyUpdatedInvoices.length > 0 ? (
            recentlyUpdatedInvoices.map(invoice => (
              <RecentlyUpdated invoice={invoice} key={invoice.id} />
            ))
          ) : (
            <span className="col-span-5 grid text-xl font-medium text-miru-dark-purple-200">
              No Recently Updated invoices available.
            </span>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-col items-start lg:flex-row lg:items-center">
        <h1 className="text-2xl font-normal text-miru-dark-purple-1000">
          All Invoices
        </h1>
        <div className="flex flex-col items-start justify-between lg:ml-4 lg:flex-row lg:items-center">
          {Object.values(filterParams).map(param =>
            Array.isArray(param)
              ? param.map(val => (
                  <span
                    className="my-2 flex h-6 items-center justify-between rounded-xl bg-miru-gray-400 px-2 text-xs font-normal capitalize text-miru-dark-purple-1000 lg:mx-2 lg:my-0"
                    key={val.value}
                  >
                    {val.label}
                    <XIcon
                      className="ml-2 cursor-pointer"
                      size={12}
                      onClick={() => handleRemoveFilter(val)}
                    />
                  </span>
                ))
              : Object(param).value != "all" && (
                  <span className="my-2 flex h-6 items-center justify-between rounded-xl bg-miru-gray-400 px-2 text-xs font-normal capitalize text-miru-dark-purple-1000 lg:mx-2 lg:my-0">
                    {Object(param).label}
                    <XIcon
                      className="ml-2 cursor-pointer"
                      size={12}
                      onClick={() => handleRemoveFilter(Object(param))}
                    />
                  </span>
                )
          )}
          {appliedFilterCount > 1 && (
            <span
              className="my-2 flex w-16 cursor-pointer items-center justify-between text-xs font-normal text-miru-han-purple-1000 lg:mx-2 lg:my-0"
              onClick={() => setFilterParams(filterIntialValues)}
            >
              <XIcon size={12} /> Clear all
            </span>
          )}
        </div>
      </div>
      <Table
        deselectInvoices={deselectInvoices}
        fetchInvoices={fetchInvoices}
        invoices={invoices}
        isDesktop={isDesktop}
        selectInvoices={selectInvoices}
        selectedInvoices={selectedInvoices}
        setInvoiceToDelete={setInvoiceToDelete}
        setShowDeleteDialog={setShowDeleteDialog}
      />
    </div>
  ) : (
    <div>No invoices to show</div>
  );
};

export default Container;
