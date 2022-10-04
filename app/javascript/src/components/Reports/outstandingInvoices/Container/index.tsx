import React, { Fragment } from "react";

import { cashFormatter, currencySymbol } from "helpers";

import TotalHeader from "common/TotalHeader";
import { useEntry } from "components/Reports/context/EntryContext";

import TableRow from "./TableRow";

import { ClientList } from "../interface";

const TableHeader = () => (
  <thead>
    <tr className="grid grid-cols-12 gap-4 items-center">
      <th
        scope="col"
        className="col-span-4 py-2 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        CLIENT /
        <br />
        INVOICE NO.
      </th>
      <th
        scope="col"
        className="col-span-3 py-2 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        ISSUED DATE /
        <br />
        DUE DATE
      </th>
      <th
        scope="col"
        className="col-span-2 py-2 text-right text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        AMOUNT
      </th>
      <th
        scope="col"
        className="col-span-3 py-2 text-right text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        STATUS
      </th>
    </tr>
  </thead>
);

const Container = () => {
  const { outstandingOverdueInvoice } = useEntry();

  const currencySymb = currencySymbol(outstandingOverdueInvoice.currency);

  return (
    <Fragment>
      <TotalHeader
        firstTitle={"TOTAL OUTSTANDING"}
        firstAmount={`${currencySymb}${cashFormatter(outstandingOverdueInvoice.summary.totalOutstandingAmount)}`}
        secondTitle={"TOTAL OVERDUE"}
        secondAmount={`${currencySymb}${cashFormatter(outstandingOverdueInvoice.summary.totalOverdueAmount)}`}
        thirdTitle={"TOTAL INVOICE AMOUNT"}
        thirdAmount={`${currencySymb}${cashFormatter(outstandingOverdueInvoice.summary.totalInvoiceAmount)}`}
      />
      <div>
        {
          outstandingOverdueInvoice.clientList.map((report: ClientList, index) => (
            report && !!report.invoices.length && (<Fragment key={index}>
              <div className="flex justify-between border-b border-miru-han-purple-1000 pt-5 pb-2 items-center mt-3">
                <h1 className="text-miru-han-purple-1000 font-bold text-xl ">{report.name}</h1>
                <p>Total outstanding amount : <span className="font-semibold">{`${currencySymb}${cashFormatter(report.totalOutstandingAmount)}`} • </span>Total overdue amount :  <span className="font-semibold">{`${currencySymb}${cashFormatter(report.totalOverdueAmount)}`}</span></p>
              </div>
              <table className="min-w-full divide-y divide-gray-200 mt-1">
                <TableHeader />
                <tbody className="bg-white divide-y divide-gray-200">
                  {
                    outstandingOverdueInvoice.currency && report.invoices.map((invoice, index) => (
                      <Fragment key={index}>
                        <TableRow key={"index"} currency={outstandingOverdueInvoice.currency} reportData={invoice} />
                      </Fragment>
                    ))
                  }
                </tbody>
              </table>
            </Fragment>)
          ))
        }
      </div>
    </Fragment>
  );
};

export default Container;
