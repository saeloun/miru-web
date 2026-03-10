import React from "react";

import { currencyFormat } from "helpers";
import { EditIcon } from "miruIcons";

import { sections } from "../../utils";

const InvoiceTotal = ({
  baseCurrency,
  baseCurrencyAmount,
  currency,
  subTotal,
  discount,
  tax,
  total,
  amountPaid,
  amountDue,
  setActiveSection,
  showEditButton = true,
  strikeAmount = "",
}) => {
  const AmountComponent = ({ label, value, currencyName }) => (
    <div className="flex w-full items-center justify-between">
      <span className="mb-2 w-1/2 pr-2 text-right text-sm font-normal leading-5 text-foreground">
        {label}
      </span>
      <span
        className={`w-1/2 text-right text-sm font-bold leading-5 text-foreground ${strikeAmount}`}
      >
        {currencyFormat(currencyName, value)}
      </span>
    </div>
  );

  return (
    <div className="py-6 px-4">
      <div className="border-b border-border">
        <AmountComponent
          currencyName={currency}
          label="Sub total"
          value={subTotal}
        />
        <AmountComponent
          currencyName={currency}
          label="Discount"
          value={discount}
        />
      </div>
      <div className="py-2">
        <AmountComponent currencyName={currency} label="Tax" value={tax} />
        <AmountComponent currencyName={currency} label="Total" value={total} />
        <AmountComponent
          currencyName={currency}
          label="Amount Paid"
          value={amountPaid}
        />
        {baseCurrency !== currency && (
          <AmountComponent
            currencyName={baseCurrency}
            label={`Amount in ${baseCurrency}`}
            value={baseCurrencyAmount}
          />
        )}
        <AmountComponent
          currencyName={currency}
          label="Amount Due"
          value={amountDue}
        />
      </div>
      {showEditButton && (
        <div
          className="mt-2 flex w-full items-center justify-center px-4 py-3 text-primary sm:px-12"
          onClick={() => {
            setActiveSection(sections.generateInvoice);
          }}
        >
          <EditIcon className="mr-2" weight="bold" />
          <span className="text-xs font-bold">Edit Billing Details</span>
        </div>
      )}
    </div>
  );
};

export default InvoiceTotal;
