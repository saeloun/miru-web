import React, { Fragment } from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import TableTitle from "./TableTitle";

import { ClientList } from "../../interface";

const Table = ({ outstandingOverdueInvoice }) => (
  <div>
    {outstandingOverdueInvoice.clientList.map(
      (report: ClientList, index) =>
        report &&
        !!report.invoices.length && (
          <div className={`${index == 0 ? "mt-0" : "mt-12"}`} key={index}>
            <TableTitle
              currency={outstandingOverdueInvoice.currency}
              report={report}
            />
            <table className="mt-1 min-w-full divide-y divide-gray-200">
              <TableHeader />
              <tbody className="divide-y divide-gray-200 bg-white">
                {outstandingOverdueInvoice.currency &&
                  report.invoices.map((invoice, index) => (
                    <Fragment key={index}>
                      <TableRow
                        key="index"
                        logo={report.logo}
                        reportData={invoice}
                      />
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        )
    )}
  </div>
);

export default Table;
