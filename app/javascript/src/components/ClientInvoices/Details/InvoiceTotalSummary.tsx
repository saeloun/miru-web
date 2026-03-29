import React from "react";

import { currencyFormat } from "helpers";

const InvoiceTotalSummary = ({ invoice, lineItems, strikeAmount }) => {
  const subTotal = lineItems
    .reduce((prev, curr) => prev + (curr.rate * curr.quantity) / 60, 0)
    .toFixed(2);

  const { amount_due, amount_paid, currency, discount, tax } = invoice;

  const total = Number(subTotal) + Number(tax) - Number(discount);

  return (
    <div className="mb-5 flex w-full justify-end px-10 pt-3 pb-10">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="pr-10 text-right text-base font-normal text-foreground">
              Sub total
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(currency, parseFloat(subTotal).toFixed(2))}
            </td>
          </tr>
          <tr className="border-b-2 border-border pb-5 ">
            <td className="py-2 pr-10 text-right text-base font-normal text-foreground">
              Discount
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(currency, parseFloat(discount).toFixed(2))}
            </td>
          </tr>
          <tr>
            <td className="pt-4 pr-10 text-right text-base font-normal text-foreground">
              Tax
            </td>
            <td
              className={`w-22 pt-4 text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(currency, tax)}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-foreground">
              Total
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(currency, total)}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-foreground">
              Amount Paid
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(currency, amount_paid)}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-foreground">
              Amount Due
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(currency, amount_due)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTotalSummary;
