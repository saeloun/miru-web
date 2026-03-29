import React from "react";

import { currencyFormat } from "helpers";
import { Badge } from "StyledComponents";

import { TableRowProps } from "components/payments/interfaces";
import { getStatusCss } from "components/payments/utils";

const TableRow = ({ baseCurrency, payment }: TableRowProps) => {
  const { clientName, invoiceNumber, status, amount, transactionType } =
    payment;

  return (
    <>
      <tr className="group block last:border-b-0 md:hidden">
        <td className="w-full pt-2 pr-6 pl-0 text-left">
          <h1 className="font-sans text-sm font-semibold leading-4 text-foreground">
            {clientName}
          </h1>
          <h3 className="pt-1 font-sans text-xs font-medium leading-4 text-muted-foreground">
            {invoiceNumber}
          </h3>
        </td>
        <td className="w-full pt-2.125 pl-0">
          <div className="text-right">
            <Badge
              className={`${getStatusCss(status)} uppercase`}
              text={status}
            />
            <h3 className="pt-1 font-sans text-sm font-medium leading-5 text-foreground">
              {baseCurrency && currencyFormat(baseCurrency, amount)}
            </h3>
          </div>
        </td>
      </tr>
      <tr className="w-full border-none">
        <td className="border-none">
          <h3 className="pt-1.5 pb-1 font-sans text-xs font-medium leading-4 text-muted-foreground">
            {transactionType}
          </h3>
        </td>
      </tr>
    </>
  );
};

export default TableRow;
