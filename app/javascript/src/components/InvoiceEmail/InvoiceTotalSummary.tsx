import React from "react";

import { currencyFormat } from "helpers";

const InvoiceTotalSummary = ({ invoice, company, lineItems }) => {
  const subTotal = lineItems.reduce((prev, curr) => prev + curr.rate * curr.quantity/60, 0).toFixed(2);
  const tax = invoice.tax;
  const discount = invoice.discount;
  const total = Number(subTotal) + Number(tax) - Number(discount);
  return (
    <div className="pt-3 pb-10 px-10 mb-5 w-full flex justify-end">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Sub total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {currencyFormat({ baseCurrency: company.base_currency, amount: parseFloat(subTotal).toFixed(2) })}
            </td>
          </tr>
          <tr
            className="pb-5 border-b-2 miru-gray-400 ">
            <td className="py-2 pr-10 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Discount
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {currencyFormat({ baseCurrency: company.base_currency, amount: parseFloat(discount).toFixed(2) })}
            </td>
          </tr>
          <tr>
            <td className="pt-4 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Tax
            </td>
            <td className="pt-4 font-bold text-base text-miru-dark-purple-1000 text-right w-22">
              {currencyFormat({ baseCurrency: company.base_currency, amount: tax })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {currencyFormat({ baseCurrency: company.base_currency, amount: total })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Amount Paid
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {currencyFormat({ baseCurrency: company.base_currency, amount: invoice.amount_paid })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Amount Due
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {currencyFormat({ baseCurrency: company.base_currency, amount: invoice.amount_due })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTotalSummary;
