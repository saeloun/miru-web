import React, { Fragment } from "react";
import TotalHeader from "common/TotalHeader";
import { useEntry } from "components/Reports/context/EntryContext";
import { cashFormatter } from "helpers/cashFormater";
import { currencySymbol } from "helpers/currencySymbol";
import TableRow from "./TableRow";
import { ClientList } from "../interface";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        scope="col"
        className="w-2/5 pr-0 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        CLIENT /
        <br />
        INVOICE NO.
      </th>
      <th
        scope="col"
        className="w-1/5 px-3 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        Issued Date /
        <br />
        Due date
      </th>
      <th
        scope="col"
        className="w-1/5 px-7 py-5 text-center text-xs font-normal text-miru-dark-purple-600 tracking-widest"
      >
        AMOUNT
      </th>
      <th
        scope="col"
        className="w-1/5 pl-6 py-5 text-right text-xs font-normal text-miru-dark-purple-600 tracking-widest"
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
                <p>Total outstanding amount : {`${currencySymb}${cashFormatter(report.totalOutstandingAmount)}`} • Total overdue amount : {`${currencySymb}${cashFormatter(report.totalOverdueAmount)}`}</p>
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
