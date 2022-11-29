import React, { Fragment } from "react";

import { cashFormatter, currencySymbol } from "helpers";

import TotalHeader from "common/TotalHeader";
import { useEntry } from "components/Reports/context/EntryContext";

import TableRow from "./TableRow";

import { ClientList } from "../interface";

const TableHeader = () => (
  <thead>
    <tr className="grid grid-cols-12 items-center gap-4">
      <th
        className="col-span-4 py-2 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        CLIENT /
        <br />
        INVOICE NO.
      </th>
      <th
        className="col-span-3 py-2 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        ISSUED DATE /
        <br />
        DUE DATE
      </th>
      <th
        className="col-span-2 py-2 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        AMOUNT
      </th>
      <th
        className="col-span-3 py-2 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
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
        firstTitle="TOTAL OUTSTANDING"
        secondTitle="TOTAL OVERDUE"
        thirdTitle="TOTAL INVOICE AMOUNT"
        firstAmount={`${currencySymb}${cashFormatter(
          outstandingOverdueInvoice.summary.totalOutstandingAmount
        )}`}
        secondAmount={`${currencySymb}${cashFormatter(
          outstandingOverdueInvoice.summary.totalOverdueAmount
        )}`}
        thirdAmount={`${currencySymb}${cashFormatter(
          outstandingOverdueInvoice.summary.totalInvoiceAmount
        )}`}
      />
      <div>
        {outstandingOverdueInvoice.clientList.map(
          (report: ClientList, index) =>
            report &&
            !!report.invoices.length && (
              <Fragment key={index}>
                <div className="mt-3 flex items-center justify-between border-b border-miru-han-purple-1000 pt-5 pb-2">
                  <h1 className="text-xl font-bold text-miru-han-purple-1000 ">
                    {report.name}
                  </h1>
                  <p>
                    Total outstanding amount :{" "}
                    <span className="font-semibold">
                      {`${currencySymb}${cashFormatter(
                        report.totalOutstandingAmount
                      )}`}{" "}
                      •{" "}
                    </span>
                    Total overdue amount :{" "}
                    <span className="font-semibold">{`${currencySymb}${cashFormatter(
                      report.totalOverdueAmount
                    )}`}</span>
                  </p>
                </div>
                <table className="mt-1 min-w-full divide-y divide-gray-200">
                  <TableHeader />
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {outstandingOverdueInvoice.currency &&
                      report.invoices.map((invoice, index) => (
                        <Fragment key={index}>
                          <TableRow
                            currency={outstandingOverdueInvoice.currency}
                            key="index"
                            reportData={invoice}
                          />
                        </Fragment>
                      ))}
                  </tbody>
                </table>
              </Fragment>
            )
        )}
      </div>
    </Fragment>
  );
};

export default Container;
