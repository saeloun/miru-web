import React from "react";

import BulkActionsWrapper from "./BulkActionsWrapper";
import NoInvoices from "./NoInvoices";
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
  isInvoiceSelected,
  selectedInvoiceCount,
  setShowBulkDeleteDialog,
  setShowBulkDownloadDialog,
  clearCheckboxes,
  downloading,
  handleReset,
  params,
}) =>
  invoices.length > 0 ? (
    <div
      className={`${
        isDesktop ? null : "overflow-x-scroll"
      } flex flex-col items-stretch`}
    >
      <InvoiceSummary
        baseCurrency={invoices[0].company.baseCurrency}
        filterParams={filterParams}
        isDesktop={isDesktop}
        setFilterParams={setFilterParams}
        summary={summary}
      />
      <RecentlyUpdated recentlyUpdatedInvoices={recentlyUpdatedInvoices} />
      <BulkActionsWrapper
        clearCheckboxes={clearCheckboxes}
        downloading={downloading}
        filterIntialValues={filterIntialValues}
        filterParams={filterParams}
        filterParamsStr={filterParamsStr}
        isDesktop={isDesktop}
        isInvoiceSelected={isInvoiceSelected}
        selectedInvoiceCount={selectedInvoiceCount}
        setFilterParams={setFilterParams}
        setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        setShowBulkDownloadDialog={setShowBulkDownloadDialog}
      />
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
    <NoInvoices
      filterParamsStr={filterParamsStr}
      handleReset={handleReset}
      isDesktop={isDesktop}
      params={params}
    />
  );

export default Container;
