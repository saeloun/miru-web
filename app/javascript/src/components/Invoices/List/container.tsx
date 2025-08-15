import React from "react";

import BulkActionsWrapper from "./BulkActionsWrapper";
import NoInvoices from "./NoInvoices";
import InfiniteScrollRecentlyUpdated from "./RecentlyUpdated/InfiniteScrollRecentlyUpdated";
import Table from "./Table";

import ChartWithSummary from "../ChartWithSummary";

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
  isStripeEnabled,
  setIsStripeEnabled,
}) =>
  invoices.length > 0 ? (
    <div
      className={`${
        isDesktop ? null : "overflow-x-scroll"
      } flex flex-col items-stretch`}
    >
      <ChartWithSummary
        summary={summary}
        baseCurrency={invoices[0]?.company?.baseCurrency || "USD"}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
      />
      <InfiniteScrollRecentlyUpdated />
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
        isStripeEnabled={isStripeEnabled}
        selectInvoices={selectInvoices}
        selectedInvoices={selectedInvoices}
        setInvoiceToDelete={setInvoiceToDelete}
        setIsStripeEnabled={setIsStripeEnabled}
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
