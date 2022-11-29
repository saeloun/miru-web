import React from "react";

import { currencyFormat } from "helpers";

const InvoiceTotalSummary = ({ invoice }) => {
  const subTotal = invoice.invoiceLineItems.reduce(
    (prev, curr) => prev + (curr.rate * curr.quantity) / 60,
    0
  );
  const tax = invoice.tax;
  const discount = invoice.discount;
  const total = Number(subTotal) + Number(tax) - Number(discount);

  return (
    <div className="mb-5 flex w-full justify-end px-10 pt-3 pb-10">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Sub total
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
              {currencyFormat({
                baseCurrency: invoice.company.currency,
                amount: parseFloat(subTotal).toFixed(2),
              })}
            </td>
          </tr>
          <tr className="miru-gray-400 border-b-2 pb-5 ">
            <td className="py-2 pr-10 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Discount
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
              {currencyFormat({
                baseCurrency: invoice.company.currency,
                amount: parseFloat(discount).toFixed(2),
              })}
            </td>
          </tr>
          <tr>
            <td className="pt-4 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Tax
            </td>
            <td className="w-22 pt-4 text-right text-base font-bold text-miru-dark-purple-1000">
              {currencyFormat({
                baseCurrency: invoice.company.currency,
                amount: tax,
              })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Total
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000">
              {currencyFormat({
                baseCurrency: invoice.company.currency,
                amount: total,
              })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Amount Paid
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
              {currencyFormat({
                baseCurrency: invoice.company.currency,
                amount: invoice.amountPaid,
              })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Amount Due
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000">
              {currencyFormat({
                baseCurrency: invoice.company.currency,
                amount: invoice.amountDue,
              })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTotalSummary;
