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
  setInvoiceToDelete,
  filterParams,
  setFilterParams
}) =>
  invoices.length > 0 ? (
    <div className="overflow-x-scroll flex flex-col items-stretch">
      <InvoiceSummary
        summary={summary}
        baseCurrency={invoices[0].company.baseCurrency}
        filterParams={filterParams}
        setFilterParams={setFilterParams}
      />

      <div className="my-20">
        <h1 className="mb-4 text-miru-dark-purple-1000 font-normal text-2xl">Recently updated</h1>
        <div className="grid grid-cols-10 gap-44 overflow-x-auto overflow-y-hidden">
          {
            recentlyUpdatedInvoices.length > 0 ?
              recentlyUpdatedInvoices.map(( invoice ) => <RecentlyUpdated invoice={invoice} key={invoice.id}/>)
              : <span className="text-xl font-medium text-miru-dark-purple-200 grid col-span-5">No Recently Updated invoices available.</span>
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
