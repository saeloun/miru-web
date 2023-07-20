import React from "react";

import { currencyFormat } from "helpers";
import { EditIcon } from "miruIcons";

import { sections } from "../../utils";

const InvoiceTotal = ({
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
        <AmountComponent label="Amount Paid" value={amountPaid} />
        <AmountComponent label="Amount Due" value={amountDue} />
      </div>
      {showEditButton && (
        <div
          className="mt-2 flex w-full items-center justify-center py-3 px-12 text-miru-han-purple-1000"
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
