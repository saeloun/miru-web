import React from "react";

import { currencyFormat } from "helpers";
import { i18n } from "../../../../i18n";

type InvoiceTax = {
  id?: number | string;
  name: string;
  amount: number | string;
  calculation_method?: string;
  value?: number | string;
};

type Invoice = {
  currency: string;
  amount_due: number | string;
  amount_paid: number | string;
  discount: number | string;
  tax: number | string;
  invoiceTaxes?: InvoiceTax[];
  invoice_taxes?: InvoiceTax[];
};

type LineItem = {
  rate: number | string;
  quantity: number | string;
};

type InvoiceTotalProps = {
  invoice: Invoice;
  lineItems: LineItem[];
  strikeAmount: string;
};

type AmountComponentProps = {
  label: string;
  value: number | string;
};

const InvoiceTotal = ({
  invoice,
  lineItems,
  strikeAmount,
}: InvoiceTotalProps) => {
  const subTotal = lineItems
    .reduce(
      (prev, curr) => prev + (Number(curr.rate) * Number(curr.quantity)) / 60,
      0
    )
    .toFixed(2);

  const { currency, amount_due, amount_paid, discount, tax } = invoice;
  const invoiceTaxes = invoice.invoiceTaxes || invoice.invoice_taxes || [];
  const total = Number(subTotal) + Number(tax) - Number(discount);

  const AmountComponent = ({ label, value }: AmountComponentProps) => (
    <div className="flex w-full items-center justify-between">
      <span className="mb-2 w-1/2 text-right text-sm font-normal leading-5 text-foreground">
        {label}
      </span>
      <span
        className={`text-right text-sm font-bold leading-5 text-foreground ${strikeAmount}`}
      >
        {currencyFormat(currency, value)}
      </span>
    </div>
  );

  return (
    <div className="py-6 px-4">
      <div className="border-b border-border">
        <AmountComponent label={i18n.t("invoices.subtotal")} value={subTotal} />
        <AmountComponent label={i18n.t("invoices.discount")} value={discount} />
      </div>
      <div className="py-2">
        {invoiceTaxes.length > 0 ? (
          invoiceTaxes.map((invoiceTax, index) => (
            <AmountComponent
              key={invoiceTax.id || `${invoiceTax.name}-${index}`}
              label={invoiceTax.name}
              value={invoiceTax.amount}
            />
          ))
        ) : (
          <AmountComponent label={i18n.t("invoices.tax")} value={tax} />
        )}
        <AmountComponent label={i18n.t("total")} value={total} />
        <AmountComponent
          label={i18n.t("invoices.amountPaid")}
          value={amount_paid}
        />
        <AmountComponent
          label={i18n.t("invoices.amountDue")}
          value={amount_due}
        />
      </div>
    </div>
  );
};

export default InvoiceTotal;
