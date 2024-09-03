import React, { Fragment, useEffect, useState } from "react";

import Logger from "js-logger";
import { useSearchParams } from "react-router-dom";
import { Pagination, Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import PaymentsProviders from "apis/payments/providers";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { ApiStatus as InvoicesStatus, LocalStorageKeys } from "constants/index";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./container";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

import BulkDeleteInvoices from "../popups/BulkDeleteInvoices";
import BulkDownloadInvoices from "../popups/BulkDownloadInvoices";
import DeleteInvoice from "../popups/DeleteInvoice";

const Invoices = () => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "all", from: "", to: "" },
    clients: [],
    status: [],
  };

  const [status, setStatus] = useState<InvoicesStatus>(InvoicesStatus.IDLE);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagy, setPagy] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = useState<any>({
    invoices_per_page: searchParams.get("invoices_per_page") || 20,
    page: searchParams.get("page") || 1,
    query: searchParams.get("query") || "",
  });

  const LS_INVOICE_FILTERS = window.localStorage.getItem(
    LocalStorageKeys.INVOICE_FILTERS
  );

  const [filterParams, setFilterParams] = useState<any>(
    JSON.parse(LS_INVOICE_FILTERS) || filterIntialValues
  );
  const [filterParamsStr, setFilterParamsStr] = useState("");
  const [selectedInput, setSelectedInput] = useState("from-input");

  const queryParams = () => new URLSearchParams(params).toString();

  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const [showBulkDeleteDialog, setShowBulkDeleteDialog] =
    useState<boolean>(false);

  const [showBulkDownloadDialog, setShowBulkDownloadDialog] =
    useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [recentlyUpdatedInvoices, setRecentlyUpdatedInvoices] =
    useState<any>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [isStripeEnabled, setIsStripeEnabled] = useState<boolean>(null);
  const selectedInvoiceCount = selectedInvoices.length;
  const isInvoiceSelected = selectedInvoiceCount > 0;
  const [selectedInvoiceCounter, setSelectedInvoiceCounter] =
    useState<number>(selectedInvoiceCount);

  const { isDesktop, handleOverlayVisibility } = useUserContext();

  useEffect(() => sendGAPageView(), []);

  const afterDownloadActions = () => {
    setSelectedInvoiceCounter(selectedInvoices.length);
    setShowBulkDownloadDialog(false);
  };

  useEffect(() => {
    if (!downloading) {
      if (isDesktop) {
        const timer = setTimeout(afterDownloadActions, 3000);

        return () => clearTimeout(timer);
      }
      afterDownloadActions();
    }
  }, [downloading]);

  useEffect(() => {
    window.localStorage.setItem(
      LocalStorageKeys.INVOICE_SEARCH_PARAM,
      params.query
    );
    fetchInvoices();
    fetchPaymentsProvidersSettings();
    setSearchParams(cleanParams(params));
  }, [params.invoices_per_page, params.page, params.query, filterParams]);

  const cleanParams = (params: any) => {
    const newParams = { ...params };
    for (const key in newParams) {
      if (!newParams[key]) {
        delete newParams[key];
      }
    }

    return newParams;
  };

  //Polling
  useEffect(() => {
    if (!invoices || !invoiceIsSending) return;
    const DELAY = 5000;
    const timer = setTimeout(() => fetchInvoicesWithoutRefresh(), DELAY);

    return () => clearTimeout(timer);
  }, [invoices]);

  const invoiceIsSending = invoices.some(
    invoice => invoice.status === "sending"
  );

  const fetchInvoicesWithoutRefresh = async () => {
    try {
      const {
        data: { invoices, pagy, summary, recentlyUpdatedInvoices },
      } = await invoicesApi.get(queryParams().concat(handleFilterParams()));

      setInvoices(invoices);
      setSummary(summary);
      setPagy(pagy);
      setRecentlyUpdatedInvoices(recentlyUpdatedInvoices);
    } catch (e) {
      Logger.error(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      setStatus(InvoicesStatus.LOADING);
      const {
        data: { invoices, pagy, summary, recentlyUpdatedInvoices },
      } = await invoicesApi.get(queryParams().concat(handleFilterParams()));

      setInvoices(invoices);
      setSummary(summary);
      setPagy(pagy);
      setRecentlyUpdatedInvoices(recentlyUpdatedInvoices);
      setSelectedInvoices([]);
      setStatus(InvoicesStatus.SUCCESS);
    } catch {
      setStatus(InvoicesStatus.ERROR);
    }
  };

  const fetchPaymentsProvidersSettings = async () => {
    try {
      const res = await PaymentsProviders.get();
      const paymentsProviders = res.data.paymentsProviders;
      const stripe = paymentsProviders.find(p => p.name === "stripe");
      setIsStripeEnabled(!!stripe && stripe.enabled);
    } catch {
      Toastr.error("ERROR! CONNECTING TO PAYMENTS");
    }
  };

  const handleFilterParams = () => {
    let filterQueryParams = "";

    filterParams.clients.forEach(client => {
      filterQueryParams += `&client[]=${client.value}`;
    });

    filterParams.status.forEach(status => {
      filterQueryParams += `&status[]=${status.value}`;
    });

    const { value, from, to } = filterParams.dateRange;

    if (value != "all" && value != "custom") {
      filterQueryParams += `&date_range=${value}`;
    }

    if (value === "custom" && from && to) {
      filterQueryParams += `&date_range=${value}`;
      filterQueryParams += `&from_date_range=${from}`;
      filterQueryParams += `&to_date_range=${to}`;
    }

    setFilterParamsStr(filterQueryParams);

    return `${filterQueryParams}`;
  };

  const selectInvoices = (invoiceIds: number[]) => {
    setSelectedInvoices(
      Array.from(new Set(selectedInvoices.concat(invoiceIds)))
    );
  };

  const deselectInvoices = (invoiceIds: number[]) =>
    setSelectedInvoices(
      selectedInvoices.filter(id => !invoiceIds.includes(id))
    );

  useEffect(() => {
    const close = e => {
      if (e.keyCode === 27) {
        setIsFilterVisible(false);
      }
    };
    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  const handleReset = () => {
    window.localStorage.removeItem(LocalStorageKeys.INVOICE_FILTERS);
    setIsFilterVisible(false);
    setFilterParams(filterIntialValues);
    setParams({ ...params, page: 1 });
  };

  if (status === InvoicesStatus.LOADING) {
    return <Loader />;
  }

  const handlePageChange = page => {
    if (page == "...") return;

    return setParams({ ...params, page });
  };

  const handleClickOnPerPage = e => {
    setParams({
      invoices_per_page: Number(e.target.value),
      page: 1,
    });
  };

  const InvoicesLayout = () => (
    <div className="h-full p-4 lg:p-0" id="invoice-list-page">
      <Header
        filterParamsStr={filterParamsStr}
        handleOverlayVisibility={handleOverlayVisibility}
        isDesktop={isDesktop}
        params={params}
        setIsFilterVisible={setIsFilterVisible}
        setParams={setParams}
      />
      {status === InvoicesStatus.SUCCESS ? (
        <Fragment>
          <Container
            deselectInvoices={deselectInvoices}
            downloading={downloading}
            fetchInvoices={fetchInvoices}
            filterIntialValues={filterIntialValues}
            filterParams={filterParams}
            filterParamsStr={filterParamsStr}
            handleReset={handleReset}
            invoices={invoices}
            isDesktop={isDesktop}
            isInvoiceSelected={isInvoiceSelected}
            isStripeEnabled={isStripeEnabled}
            params={params}
            recentlyUpdatedInvoices={recentlyUpdatedInvoices}
            selectInvoices={selectInvoices}
            selectedInvoiceCount={selectedInvoiceCount}
            selectedInvoices={selectedInvoices}
            setFilterParams={setFilterParams}
            setInvoiceToDelete={setInvoiceToDelete}
            setIsStripeEnabled={setIsStripeEnabled}
            setShowBulkDeleteDialog={setShowBulkDeleteDialog}
            setShowBulkDownloadDialog={setShowBulkDownloadDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            summary={summary}
            clearCheckboxes={() =>
              deselectInvoices(invoices.map(invoice => invoice.id))
            }
          />
          {isFilterVisible && (
            <FilterSideBar
              filterParams={filterParams}
              handleReset={handleReset}
              isDesktop={isDesktop}
              selectedInput={selectedInput}
              setDefaultParams={() => setParams({ ...params, page: 1 })}
              setFilterParams={setFilterParams}
              setIsFilterVisible={setIsFilterVisible}
              setSelectedInput={setSelectedInput}
            />
          )}
          {invoices.length > 0 && (
            <Pagination
              isPerPageVisible
              currentPage={pagy?.page}
              handleClick={handlePageChange}
              handleClickOnPerPage={handleClickOnPerPage}
              isFirstPage={pagy?.first}
              isLastPage={pagy?.last}
              itemsPerPage={params?.invoices_per_page}
              nextPage={pagy?.next}
              prevPage={pagy?.prev}
              title="invoices/page"
              totalPages={pagy?.pages}
            />
          )}
          {showDeleteDialog && (
            <DeleteInvoice
              fetchInvoices={fetchInvoices}
              invoice={invoiceToDelete}
              setShowDeleteDialog={setShowDeleteDialog}
              showDeleteDialog={showDeleteDialog}
            />
          )}
          {showBulkDeleteDialog && (
            <BulkDeleteInvoices
              fetchInvoices={fetchInvoices}
              invoices_ids={selectedInvoices}
              setShowBulkDeleteDialog={setShowBulkDeleteDialog}
              showBulkDeleteDialog={showBulkDeleteDialog}
            />
          )}
          {showBulkDownloadDialog && (
            <BulkDownloadInvoices
              downloading={downloading}
              selectedInvoiceCounter={selectedInvoiceCounter}
              selectedInvoices={selectedInvoices}
              setDownloading={setDownloading}
              setSelectedInvoiceCounter={setSelectedInvoiceCounter}
            />
          )}
        </Fragment>
      ) : (
        status === InvoicesStatus.ERROR && (
          <div className="tracking-wide mt-50 flex items-center justify-center text-2xl font-medium text-miru-han-purple-1000">
            Something went Wrong!
          </div>
        )
      )}
    </div>
  );

  const Main = withLayout(InvoicesLayout, !isDesktop, !isDesktop);

  return isDesktop ? InvoicesLayout() : <Main />;
};

export default Invoices;
