import * as React from "react";

import { ApiStatus as InvoicesStatus } from "constants/index";

import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import invoicesApi from "apis/invoices";
import Pagination from "common/Pagination";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./container";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

import { TOASTER_DURATION } from "../../../constants/index";
import BulkDeleteInvoices from "../popups/BulkDeleteInvoices";
import DeleteInvoice from "../popups/DeleteInvoice";

const Invoices: React.FC = () => {
  const filterIntialValues = {
    dateRange: { label: "All", value: "all", from: "", to: "" },
    clients: [],
    status: [],
  };

  const [status, setStatus] = React.useState<InvoicesStatus>(
    InvoicesStatus.IDLE
  );
  const [invoices, setInvoices] = React.useState<null | any[]>(null);
  const [summary, setSummary] = React.useState<any>(null);
  const [pagy, setPagy] = React.useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    invoices_per_page: searchParams.get("invoices_per_page") || 20,
    page: searchParams.get("page") || 1,
    query: searchParams.get("query") || "",
  });
  const [filterParams, setFilterParams] = React.useState(filterIntialValues);
  const [filterParamsStr, setFilterParamsStr] = React.useState("");
  const [selectedInput, setSelectedInput] = React.useState("from-input");

  const queryParams = () => new URLSearchParams(params).toString();

  const [selectedInvoices, setSelectedInvoices] = React.useState<number[]>([]);
  const [isFilterVisible, setFilterVisibilty] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    React.useState<boolean>(false);
  const [showBulkDeleteDialaog, setShowBulkDeleteDialog] =
    React.useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState(null);
  const [recentlyUpdatedInvoices, setRecentlyUpdatedInvoices] =
    React.useState(null);

  const selectedInvoiceCount = selectedInvoices.length;
  const isInvoiceSelected = selectedInvoiceCount > 0;

  React.useEffect(() => sendGAPageView(), []);

  React.useEffect(() => {
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
    } catch (error) {
      setStatus(InvoicesStatus.ERROR);
    }
  };

  const handleFilterParams = () => {
    let filterQueryParams = "";

    filterParams.clients.forEach((client) => {
      filterQueryParams += `&client_ids[]=${client.value}`;
    });

    filterParams.status.forEach((status) => {
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
      selectedInvoices.filter((id) => !invoiceIds.includes(id))
    );

  return (
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header
        params={params}
        setParams={setParams}
        setFilterVisibilty={setFilterVisibilty}
        clearCheckboxes={() =>
          deselectInvoices(invoices.map((invoice) => invoice.id))
        }
        selectedInvoiceCount={selectedInvoiceCount}
        isInvoiceSelected={isInvoiceSelected}
        setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        filterParamsStr={filterParamsStr}
      />

      {status === InvoicesStatus.SUCCESS && (
        <React.Fragment>
          <Container
            summary={summary}
            invoices={invoices}
            selectedInvoices={selectedInvoices}
            recentlyUpdatedInvoices={recentlyUpdatedInvoices}
            selectInvoices={selectInvoices}
            deselectInvoices={deselectInvoices}
            setShowDeleteDialog={setShowDeleteDialog}
            setInvoiceToDelete={setInvoiceToDelete}
            filterParams={filterParams}
            setFilterParams={setFilterParams}
            filterIntialValues={filterIntialValues}
            filterParamsStr={filterParamsStr}
            fetchInvoices={fetchInvoices}
          />

          {isFilterVisible && (
            <FilterSideBar
              filterIntialValues={filterIntialValues}
              setFilterVisibilty={setFilterVisibilty}
              filterParams={filterParams}
              setFilterParams={setFilterParams}
              selectedInput={selectedInput}
              setSelectedInput={setSelectedInput}
            />
          )}

          {invoices.length && (
            <Pagination pagy={pagy} params={params} setParams={setParams} />
          )}
          {showDeleteDialog && (
            <DeleteInvoice
              invoice={invoiceToDelete}
              setShowDeleteDialog={setShowDeleteDialog}
              fetchInvoices={fetchInvoices}
            />
          )}
          {showBulkDeleteDialaog && (
            <BulkDeleteInvoices
              invoices_ids={selectedInvoices}
              setShowBulkDeleteDialog={setShowBulkDeleteDialog}
              fetchInvoices={fetchInvoices}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default Invoices;
