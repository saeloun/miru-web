import React from "react";

import { currencyFormat } from "helpers";
import { i18n } from "../../../i18n";

const InvoiceTotalSummary = ({ invoice, strikeAmount = "" }) => {
  const subTotal = invoice.invoiceLineItems.reduce(
    (prev, curr) => prev + (curr.rate * curr.quantity) / 60,
    0
  );
  const tax = invoice.tax;
  const invoiceTaxes = invoice.invoiceTaxes || invoice.invoice_taxes || [];
  const discount = invoice.discount;
  const total = Number(subTotal) + Number(tax) - Number(discount);

  return (
    <div className="mb-5 flex w-full justify-end px-4 pt-3 pb-10 sm:px-10">
      <table className="w-full sm:w-2/3 lg:w-1/3">
        <tbody>
          <tr>
            <td className="pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              {i18n.t("invoices.lineItems")}
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(
                invoice.currency,
                parseFloat(subTotal).toFixed(2)
              )}
            </td>
          </tr>
          <tr className="border-b-2 border-border pb-5 ">
            <td className="py-2 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              {i18n.t("invoices.discount")}
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(
                invoice.currency,
                parseFloat(discount).toFixed(2)
              )}
            </td>
          </tr>
          {invoiceTaxes.length > 0 ? (
            invoiceTaxes.map(invoiceTax => (
              <tr key={invoiceTax.id || invoiceTax.name}>
                <td className="pt-4 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
                  {invoiceTax.name}
                </td>
                <td
                  className={`w-22 pt-4 text-right text-base font-bold text-foreground ${strikeAmount}`}
                >
                  {currencyFormat(invoice.currency, invoiceTax.amount)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="pt-4 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
                {i18n.t("invoices.tax")}
              </td>
              <td
                className={`w-22 pt-4 text-right text-base font-bold text-foreground ${strikeAmount}`}
              >
                {currencyFormat(invoice.currency, tax)}
              </td>
            </tr>
          )}
          <tr>
            <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              {i18n.t("total")}
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(invoice.currency, total)}
            </td>
          </tr>
          {invoice.currency !== invoice.company.currency && (
            <tr>
              <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
                {i18n.t("amount")} {invoice.company.currency}
              </td>
              <td
                className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
              >
                {currencyFormat(
                  invoice.company.currency,
                  invoice.baseCurrencyAmount
                )}
              </td>
            </tr>
          )}
          <tr>
            <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              {i18n.t("invoices.markAsPaid")}
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(invoice.currency, invoice.amountPaid)}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              {i18n.t("invoices.dueDate")}
            </td>
            <td
              className={`text-right text-base font-bold text-foreground ${strikeAmount}`}
            >
              {currencyFormat(invoice.currency, invoice.amountDue)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTotalSummary;
