import * as React from "react";

import RecentlyUpdated from "./RecentlyUpdated";
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

      <div className="my-20">
        <h1 className="mb-4 text-miru-dark-purple-1000 font-normal text-2xl">Recently updated</h1>
        <div className="flex justify-around overflow-x-scroll">
          <RecentlyUpdated/>
          <RecentlyUpdated/>
          <RecentlyUpdated/>
          <RecentlyUpdated/>
          <RecentlyUpdated/>
          <RecentlyUpdated/>
          <RecentlyUpdated/>
        </div>
      </div>

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
