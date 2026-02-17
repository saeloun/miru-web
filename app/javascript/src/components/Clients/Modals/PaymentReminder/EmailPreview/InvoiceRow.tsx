import React from "react";

import { currencyFormat } from "helpers";
import { Badge, Button } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const InvoiceRow = ({ invoice, isLast }) => {
  const {
    amount,
    company,
    dueDate,
    invoiceNumber,
    issueDate,
    status,
    externalViewKey,
  } = invoice;

  const { baseCurrency } = company;

  return (
    <table
      className={`relative min-w-full overflow-x-scroll ${
        isLast ? "border-0" : "mb-10 border-b border-miru-gray-200"
      }`}
    >
      <thead>
        <tr>
          <th
            className="w-1/6 whitespace-nowrap py-0 px-2 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal"
            scope="col"
          >
            INVOICE NO.
          </th>
          <th
            className="w-1/6 whitespace-nowrap py-0 px-2 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal"
            scope="col"
          >
            ISSUE DATE
          </th>
          <th
            className="w-1/6 whitespace-nowrap py-0 px-2 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal"
            scope="col"
          >
            DUE DATE
          </th>
          <th
            className="hidden w-1/6 px-2 py-0 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
            scope="col"
          >
            AMOUNT
          </th>
          <th
            className="hidden w-1/6 px-2 py-0 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
            scope="col"
          >
            STATUS
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="w-1/6 px-2 pb-10 text-base">{invoiceNumber}</td>
          <td className="w-1/6 px-2 pb-10 text-base">{issueDate}</td>
          <td className="w-1/6 px-2 pb-10 text-base">{dueDate}</td>
          <td className="w-1/6 px-2 pb-10 text-left text-base tracking-normal text-miru-dark-purple-1000 lg:text-base">
            {currencyFormat(baseCurrency, amount)}
          </td>
          <td className="w-1/6 px-2 pb-10 text-left font-medium">
            <Badge
              className={`${getStatusCssClass(status)} uppercase`}
              text={status}
            />
          </td>
          <td>
            <Button
              className="absolute top-0 right-0 py-2 px-5 text-base"
              style="primary"
            >
              <a
                href={`/invoices/${externalViewKey}/view`}
                rel="noreferrer"
                target="_blank"
              >
                View Invoice
              </a>
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default InvoiceRow;
