import * as React from "react";

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
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header
        filterParamsStr={filterParamsStr}
        isInvoiceSelected={isInvoiceSelected}
        params={params}
        selectedInvoiceCount={selectedInvoiceCount}
        setFilterVisibilty={setFilterVisibilty}
        setParams={setParams}
        setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        clearCheckboxes={() =>
          deselectInvoices(invoices.map(invoice => invoice.id))
        }
      />
      {status === InvoicesStatus.SUCCESS && (
        <React.Fragment>
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
              setFilterVisibilty={setFilterVisibilty}
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
          {showBulkDeleteDialaog && (
            <BulkDeleteInvoices
              fetchInvoices={fetchInvoices}
              invoices_ids={selectedInvoices}
              setShowBulkDeleteDialog={setShowBulkDeleteDialog}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default Invoices;
