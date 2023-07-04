import React from "react";

import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const MessageTab = ({ invoice }) => {
  const { amount, company, dueDate, invoiceNumber, issueDate, status } =
    invoice;

  const { baseCurrency } = company;

  return (
    <table className="min-w-full divide-y divide-miru-gray-1000 overflow-x-scroll lg:mt-4">
      <thead>
        <tr>
          <th
            className="w-1/6 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:px-2"
            scope="col"
          >
            INVOICE NO.
          </th>
          <th
            className="w-1/6 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:px-2"
            scope="col"
          >
            ISSUE DATE
          </th>
          <th
            className="w-1/6 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:pr-2"
            scope="col"
          >
            DUE DATE
          </th>
          <th
            className="hidden w-1/6 px-2 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
            scope="col"
          >
            AMOUNT
          </th>
          <th
            className="hidden w-1/6 px-2 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
            scope="col"
          >
            STATUS
          </th>
          <th
            className="table-cell w-1/6 px-2 py-5 text-left text-xs font-medium leading-4 tracking-widest text-miru-black-1000"
            scope="col"
          >
            <a
              href="#"
              target="_blank"
              className="shadow-smfocus:outline-none relative top-5 cursor-pointer border border-transparent
                bg-miru-han-purple-1000 p-2 text-base text-white"
            >
              View Invoice
            </a>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="w-1/6 px-0 py-0 lg:text-base">{invoiceNumber}</td>
          <td className="w-1/6 px-0 py-0 lg:text-base">{issueDate}</td>
          <td className="w-1/6 px-0 py-0 lg:text-base">{dueDate}</td>
          <td className="w-1/6 px-0 text-left text-base tracking-normal text-miru-dark-purple-1000 lg:w-1/6 lg:px-3 lg:pt-2 lg:pb-7 lg:text-base">
            {currencyFormat(baseCurrency, amount)}
          </td>
          <td className="w-1/6 px-2 text-left font-medium lg:pb-10">
            <Badge
              className={`${getStatusCssClass(status)} mt-4 uppercase`}
              text={status}
            />
          </td>
          <td />
        </tr>
      </tbody>
    </table>
  );
};

export default MessageTab;
