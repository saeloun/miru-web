import React from "react";

import { currencyFormat } from "helpers";

const InvoiceTotal = ({ invoice, lineItems, strikeAmount }) => {
  const subTotal = lineItems
    .reduce((prev, curr) => prev + (curr.rate * curr.quantity) / 60, 0)
    .toFixed(2);

  const { currency, amount_due, amount_paid, discount, tax } = invoice;
  const total = Number(subTotal) + Number(tax) - Number(discount);

  const AmountComponent = ({ label, value }) => (
    <div className="flex w-full items-center justify-between">
      <span className="mb-2 w-1/2 text-right text-sm font-normal leading-5 text-miru-dark-purple-1000">
        {label}
      </span>
      <span
        className={`text-right text-sm font-bold leading-5 text-miru-dark-purple-1000 ${strikeAmount}`}
      >
        {currencyFormat(currency, value)}
      </span>
    </div>
  );

  return (
    <div className="py-6 px-4">
      <div className="border-b border-miru-gray-400">
        <AmountComponent label="Sub total" value={subTotal} />
        <AmountComponent label="Discount" value={discount} />
      </div>
      <div className="py-2">
        <AmountComponent label="Tax" value={tax} />
        <AmountComponent label="Total" value={total} />
        <AmountComponent label="Amount Paid" value={amount_paid} />
        <AmountComponent label="Amount Due" value={amount_due} />
      </div>
    </div>
  );
};

export default InvoiceTotal;
