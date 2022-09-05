import * as React from "react";

import Table from "./Table";

import InvoiceSummary from "../InvoiceSummary";

const Container = ({
  summary,
  invoices,
  selectedInvoices,
  selectInvoices,
  deselectInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete
}) =>
  invoices.length > 0 ? (
    <>
      <InvoiceSummary
        summary={summary}
        baseCurrency={invoices[0].company.baseCurrency}
      />

      <Table
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        selectInvoices={selectInvoices}
        deselectInvoices={deselectInvoices}
        setShowDeleteDialog= {setShowDeleteDialog}
        setInvoiceToDelete ={setInvoiceToDelete}
      />
    </>
  ) : (
    <div>No invoices to show</div>
  );

export default Container;
