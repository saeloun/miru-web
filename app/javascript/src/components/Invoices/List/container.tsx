import * as React from "react";

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
  setInvoiceToDelete
}) =>
  invoices.length > 0 ? (
    <div className="overflow-x-scroll flex flex-col items-stretch">
      <InvoiceSummary
        summary={summary}
        baseCurrency={invoices[0].company.baseCurrency}
      />

      <div className="my-20">
        <h1 className="mb-4 text-miru-dark-purple-1000 font-normal text-2xl">Recently updated</h1>
        <div className="flex flex-row justify-between md:justify-start overflow-x-auto overflow-y-hidden">
          {
            recentlyUpdatedInvoices.length > 0 ?
              recentlyUpdatedInvoices.map((invoice, index) => <RecentlyUpdated invoice={invoice} index={index}/>)
              : <span className="text-xl font-medium text-miru-dark-purple-1000">No Recently Updated invoices available.</span>
          }
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
    </div>
  ) : (
    <div>No invoices to show</div>
  );

export default Container;
