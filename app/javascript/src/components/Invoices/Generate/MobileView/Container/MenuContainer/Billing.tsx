import React from "react";

const InputComponent = ({ label, value, onChange, readOnly = false }) => (
  <div className="flex w-full items-center justify-between">
    <span className="mb-2 w-1/2 text-right text-sm font-normal leading-5 text-miru-dark-purple-1000">
      {label}
    </span>
    <input
      placeholder="$0.00"
      readOnly={readOnly}
      type="number"
      value={value}
      className={`focus:outline-none mb-2 w-2/5 rounded px-2 py-3 text-right text-sm font-medium text-miru-dark-purple-1000 placeholder:text-miru-dark-purple-200 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000 ${
        readOnly ? "bg-transparent" : "cursor-pointer bg-miru-gray-100"
      }`}
      onChange={onChange}
    />
  </div>
);

const Billing = ({
  amountDue,
  amountPaid,
  baseCurrencyAmount,
  discount,
  invoiceDetails,
  setAmount,
  setAmountDue,
  setDiscount,
  setTax,
  tax,
  total,
  setTotal,
  subTotal,
  setSubTotal,
  setBaseCurrencyAmount,
}) => (
  <div className="py-6">
    <div className="border-b border-miru-gray-400">
      <InputComponent
        readOnly
        label="Sub total"
        value={subTotal}
        onChange={e => setSubTotal(e.target.value)}
      />
      <InputComponent
        label="Discount"
        value={discount}
        onChange={e => setDiscount(e.target.value)}
      />
    </div>
    <div className="py-2">
      <InputComponent
        label="Tax"
        value={tax}
        onChange={e => setTax(e.target.value)}
      />
      <InputComponent
        readOnly
        label="Total"
        value={total}
        onChange={e => setTotal(e.target.value)}
      />
      <InputComponent
        label={`Amount in ${invoiceDetails?.companyDetails?.currency}`}
        value={baseCurrencyAmount}
        onChange={e => setBaseCurrencyAmount(e.target.value)}
      />
      <InputComponent
        readOnly
        label="Amount Paid"
        value={amountPaid}
        onChange={e => setAmount(e.target.value)}
      />
      <InputComponent
        readOnly
        label="Amount Due"
        value={amountDue}
        onChange={e => setAmountDue(e.target.value)}
      />
    </div>
  </div>
);

export default Billing;
