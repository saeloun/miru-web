import React from "react";

import BulkActionsWrapper from "./BulkActionsWrapper";
import NoInvoices from "./NoInvoices";
import PaymentSetupPrompt from "./PaymentSetupPrompt";
import InfiniteScrollRecentlyUpdated from "./RecentlyUpdated/InfiniteScrollRecentlyUpdated";
import InvoiceListTable from "./Table/InvoiceListTable";

import ChartWithSummary from "../ChartWithSummary";
import { i18n } from "../../../i18n";

const InvoiceListContent = ({
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
  isPaymentEnabled,
  setIsPaymentEnabled,
  hasMoreInvoices,
  loadingMoreInvoices,
  loadMoreTriggerRef,
  totalInvoices,
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
      {isPaymentEnabled === false && (
        <PaymentSetupPrompt isDesktop={isDesktop} />
      )}
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
      <InvoiceListTable
        deselectInvoices={deselectInvoices}
        fetchInvoices={fetchInvoices}
        invoices={invoices}
        isDesktop={isDesktop}
        isPaymentEnabled={isPaymentEnabled}
        selectInvoices={selectInvoices}
        selectedInvoices={selectedInvoices}
        setInvoiceToDelete={setInvoiceToDelete}
        setIsPaymentEnabled={setIsPaymentEnabled}
        setShowDeleteDialog={setShowDeleteDialog}
      />
      <div className="mt-4 flex flex-col items-center gap-2 pb-2 text-sm text-gray-500">
        <span>
          {i18n.t("invoices.invoices")}: {invoices.length} / {totalInvoices}
        </span>
        {!loadingMoreInvoices && hasMoreInvoices && (
          <span>{i18n.t("invoices.scrollToLoadMore")}</span>
        )}
        {loadingMoreInvoices && (
          <span>{i18n.t("invoices.loadingMoreInvoices")}</span>
        )}
        {!loadingMoreInvoices && hasMoreInvoices && (
          <div ref={loadMoreTriggerRef} className="h-8 w-full" />
        )}
        {!hasMoreInvoices && totalInvoices > 0 && (
          <span>{i18n.t("invoices.allInvoicesLoaded")}</span>
        )}
      </div>
    </div>
  ) : (
    <NoInvoices
      filterParamsStr={filterParamsStr}
      handleReset={handleReset}
      isDesktop={isDesktop}
      params={params}
    />
  );

export default InvoiceListContent;
