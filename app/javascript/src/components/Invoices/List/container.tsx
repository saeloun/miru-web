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
  fetchInvoices
}) => {
  const [isDesktop, setIsDesktop] = useState(innerWidth > 650);
  let appliedFilterCount = (filterParamsStr.match(/&/g) || []).length;
  filterParamsStr.includes("custom") && (appliedFilterCount = appliedFilterCount - 2);

  const handleRemoveFilter = (removeval) => {
    let name, newArr;
    for (const [key, value] of Object.entries(filterParams)) {
      Array.isArray(value) ?
        value.map((v) => {
          if (v == removeval) {
            name = key;
            newArr = value.filter((v) => v != removeval);
          }
        }) : value == removeval && (
          name = key,
          newArr = filterIntialValues.dateRange
        );
    }
    setFilterParams({
      ...filterParams,
      [name]: newArr
    });
  };

  useEffect(() => {
    window.addEventListener("resize", () => setIsDesktop(innerWidth > 650));
    window.removeEventListener("resize", () => setIsDesktop(innerWidth > 650));
  }, [innerWidth]);

  return invoices.length > 0 ? (
    <div
      className={`${
        isDesktop ? null : "overflow-x-scroll"
      } flex flex-col items-stretch`}
    >
      <InvoiceSummary
        summary={summary}
        baseCurrency={invoices[0].company.baseCurrency}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
      />

      <div className="my-20">
        <h1 className="mb-4 text-miru-dark-purple-1000 font-normal text-2xl">
          Recently updated
        </h1>
        <div className="grid grid-cols-10 gap-44 overflow-x-auto overflow-y-hidden">
          {
            recentlyUpdatedInvoices.length > 0 ?
              recentlyUpdatedInvoices.map(( invoice ) => <RecentlyUpdated invoice={invoice} key={invoice.id}/>)
              : <span className="text-xl font-medium text-miru-dark-purple-200 grid col-span-5">No Recently Updated invoices available.</span>
          }
        </div>
      </div>

      <>
        <div className="mb-4 flex items-center">
          <h1 className="text-miru-dark-purple-1000 font-normal text-2xl">
            All invoices
          </h1>
          <div className="ml-4 flex items-center justify-between">
            {Object.values(filterParams).map(
              (param) =>
                Array.isArray(param) ?
                  param.map((val) => (
                    <span key={val.value} className="mx-2 px-2 h-6 font-normal text-xs text-miru-dark-purple-1000 bg-miru-gray-400 rounded-xl flex items-center justify-between capitalize">
                      {val.label}
                      <XIcon
                        size={12}
                        className="ml-2 cursor-pointer"
                        onClick={() => handleRemoveFilter(val)}
                      />
                    </span>
                  )
                  ) : Object(param).value != "all" && (
                    <span className="mx-2 px-2 h-6 font-normal text-xs text-miru-dark-purple-1000 bg-miru-gray-400 rounded-xl flex items-center justify-between capitalize">
                      {Object(param).label}
                      <XIcon
                        size={12}
                        className="ml-2 cursor-pointer"
                        onClick={() => handleRemoveFilter(Object(param))}
                      />
                    </span>
                  ))}
            {appliedFilterCount > 1 && (
              <span
                onClick={() => setFilterParams(filterIntialValues)}
                className="ml-2 w-16 text-xs text-miru-han-purple-1000 font-normal flex items-center justify-between cursor-pointer"
              >
                <XIcon size={12} /> Clear all
              </span>
            )}
          </div>
        </div>
        <Table
          invoices={invoices}
          selectedInvoices={selectedInvoices}
          selectInvoices={selectInvoices}
          deselectInvoices={deselectInvoices}
          setShowDeleteDialog={setShowDeleteDialog}
          setInvoiceToDelete={setInvoiceToDelete}
          fetchInvoices={fetchInvoices}
        />
      </>
    </div>
  ) : (
    <div>No invoices to show</div>
  );
};

export default Container;
