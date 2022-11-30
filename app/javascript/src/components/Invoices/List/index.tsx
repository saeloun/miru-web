import React, { Fragment, useEffect, useState } from "react";

import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import invoicesApi from "apis/invoices";
import Pagination from "common/Pagination";
import { ApiStatus as InvoicesStatus } from "constants/index";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./container";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

import { TOASTER_DURATION } from "../../../constants";
import BulkDeleteInvoices from "../popups/BulkDeleteInvoices";
import DeleteInvoice from "../popups/DeleteInvoice";

const Invoices = () => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "all", from: "", to: "" },
    clients: [],
    status: [],
  };

  const [status, setStatus] = useState<InvoicesStatus>(InvoicesStatus.IDLE);
  const [invoices, setInvoices] = useState<null | any[]>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pagy, setPagy] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = useState<any>({
    invoices_per_page: searchParams.get("invoices_per_page") || 20,
    page: searchParams.get("page") || 1,
    query: searchParams.get("query") || "",
  });
  const [filterParams, setFilterParams] = useState(filterIntialValues);
  const [filterParamsStr, setFilterParamsStr] = useState("");
  const [selectedInput, setSelectedInput] = useState("from-input");

  const queryParams = () => new URLSearchParams(params).toString();

  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const [showBulkDeleteDialog, setShowBulkDeleteDialog] =
    useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [recentlyUpdatedInvoices, setRecentlyUpdatedInvoices] = useState(null);

  const selectedInvoiceCount = selectedInvoices.length;
  const isInvoiceSelected = selectedInvoiceCount > 0;

  useEffect(() => sendGAPageView(), []);

  useEffect(() => {
    fetchInvoices();
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

  const handleFilterParams = () => {
    let filterQueryParams = "";

    filterParams.clients.forEach(client => {
      filterQueryParams += `&client_ids[]=${client.value}`;
    });

    filterParams.status.forEach(status => {
      filterQueryParams += `&statuses[]=${status.value}`;
    });

    const { value, from, to } = filterParams.dateRange;

    if (value != "all" && value != "custom") {
      filterQueryParams += `&from_to[date_range]=${value}`;
    }

    if (value === "custom" && from && to) {
      filterQueryParams += `&from_to[date_range]=${value}`;
      filterQueryParams += `&from_to[from]=${from}`;
      filterQueryParams += `&from_to[to]=${to}`;
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

  return (
    <Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header
        filterParamsStr={filterParamsStr}
        isInvoiceSelected={isInvoiceSelected}
        params={params}
        selectedInvoiceCount={selectedInvoiceCount}
        setIsFilterVisible={setIsFilterVisible}
        setParams={setParams}
        setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        clearCheckboxes={() =>
          deselectInvoices(invoices.map(invoice => invoice.id))
        }
      />
      {status === InvoicesStatus.SUCCESS && (
        <Fragment>
          <Container
            deselectInvoices={deselectInvoices}
            fetchInvoices={fetchInvoices}
            filterIntialValues={filterIntialValues}
            filterParams={filterParams}
            filterParamsStr={filterParamsStr}
            invoices={invoices}
            recentlyUpdatedInvoices={recentlyUpdatedInvoices}
            selectInvoices={selectInvoices}
            selectedInvoices={selectedInvoices}
            setFilterParams={setFilterParams}
            setInvoiceToDelete={setInvoiceToDelete}
            setShowDeleteDialog={setShowDeleteDialog}
            summary={summary}
          />
          {isFilterVisible && (
            <FilterSideBar
              filterIntialValues={filterIntialValues}
              filterParams={filterParams}
              selectedInput={selectedInput}
              setFilterParams={setFilterParams}
              setIsFilterVisible={setIsFilterVisible}
              setSelectedInput={setSelectedInput}
            />
          )}
          {invoices.length && (
            <Pagination pagy={pagy} params={params} setParams={setParams} />
          )}
          {showDeleteDialog && (
            <DeleteInvoice
              fetchInvoices={fetchInvoices}
              invoice={invoiceToDelete}
              setShowDeleteDialog={setShowDeleteDialog}
            />
          )}
          {showBulkDeleteDialog && (
            <BulkDeleteInvoices
              fetchInvoices={fetchInvoices}
              invoices_ids={selectedInvoices}
              setShowBulkDeleteDialog={setShowBulkDeleteDialog}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default Invoices;
