import * as React from "react";
import { useSearchParams } from "react-router-dom";

import invoicesApi from "apis/invoices";
import Pagination from "common/Pagination";

import Container from "./container";
import FilterSideBar from "./FilterSideBar";
import Header from "./Header";

import { ApiStatus as InvoicesStatus } from "../../../constants";
import BulkDeleteInvoices from "../popups/BulkDeleteInvoices";
import DeleteInvoice from "../popups/DeleteInvoice";

const Invoices: React.FC = () => {
  const [status, setStatus] = React.useState<InvoicesStatus>(
    InvoicesStatus.IDLE
  );
  const [invoices, setInvoices] = React.useState<null | any[]>(null);
  const [summary, setSummary] = React.useState<any>(null);
  const [pagy, setPagy] = React.useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    invoices_per_page: searchParams.get("invoices_per_page") || 20,
    page: searchParams.get("page") || 1
  });

  const queryParams = () => new URLSearchParams(params).toString();

  const [selectedInvoices, setSelectedInvoices] = React.useState<number[]>([]);

  const [isFilterVisible, setFilterVisibilty] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    React.useState<boolean>(false);
  const [showBulkDeleteDialaog, setShowBulkDeleteDialog] =
    React.useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState(null);

  const selectedInvoiceCount = selectedInvoices.length;
  const isInvoiceSelected = selectedInvoiceCount > 0;

  React.useEffect(() => {
    fetchInvoices();
    setSearchParams(params);
  }, [params.invoices_per_page, params.page]);

  const fetchInvoices = async () => {
    try {
      setStatus(InvoicesStatus.LOADING);
      const {
        data: { invoices, pagy, summary }
      } = await invoicesApi.get(queryParams());

      setInvoices(invoices);
      setSummary(summary);
      setPagy(pagy);
      setSelectedInvoices([]);
      setStatus(InvoicesStatus.SUCCESS);
    } catch (error) {
      setStatus(InvoicesStatus.ERROR);
    }
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
    status === InvoicesStatus.SUCCESS && (
      <React.Fragment>
        <Header
          setFilterVisibilty={setFilterVisibilty}
          clearCheckboxes={() =>
            deselectInvoices(invoices.map((invoice) => invoice.id))
          }
          selectedInvoiceCount={selectedInvoiceCount}
          isInvoiceSelected={isInvoiceSelected}
          setShowBulkDeleteDialog={setShowBulkDeleteDialog}
        />

        <Container
          summary={summary}
          invoices={invoices}
          selectedInvoices={selectedInvoices}
          selectInvoices={selectInvoices}
          deselectInvoices={deselectInvoices}
          setShowDeleteDialog={setShowDeleteDialog}
          setInvoiceToDelete={setInvoiceToDelete}
        />

        {isFilterVisible && (
          <FilterSideBar setFilterVisibilty={setFilterVisibilty} />
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
    )
  );
};

export default Invoices;
