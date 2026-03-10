import React, { useState, useEffect } from "react";

import { currencyFormat } from "helpers";

const InvoiceTotal = ({
  currency,
  clientCurrency,
  baseCurrencyAmount,
  newLineItems,
  amountPaid,
  amountDue,
  setAmountDue,
  setAmount,
  discount,
  setDiscount,
  setBaseCurrencyAmount,
  tax,
  setTax,
  manualEntryArr,
}) => {
  const [subTotal, setSubTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const onEnter = (e, type) => {
    if (e.key === "Enter") {
      document.getElementById(type).blur();
    }
  };

  useEffect(() => {
    const newLineItemsSubTotalArr = newLineItems.filter(
      lineItem => !lineItem._destroy
    );

    const newLineItemsSubTotal = newLineItemsSubTotalArr.reduce(
      (sum, { lineTotal }) => sum + Number(lineTotal),
      0
    );

    const allManualEntries = manualEntryArr.filter(
      lineItem => !lineItem._destroy
    );

    const manualEntryTotal = allManualEntries.reduce(
      (sum, { lineTotal }) => sum + Number(lineTotal),
      0
    );

    const subTotal = Number(newLineItemsSubTotal) + Number(manualEntryTotal);
    const newTotal = subTotal + Number(tax) - Number(discount);
    setSubTotal(subTotal);
    setTotal(newTotal);
    setAmount(newTotal);
    setAmountDue(newTotal - amountPaid);
  }, [newLineItems, manualEntryArr, discount, subTotal, tax]);

  return (
    <div className="mb-5 flex w-full justify-end px-4 pt-3 pb-10 sm:px-10">
      <table className="w-full sm:w-2/3 lg:w-1/3">
        <tbody>
          <tr>
            <td className="pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              Sub total
            </td>
            <td className="text-right text-base font-bold text-foreground ">
              {subTotal
                ? currencyFormat(clientCurrency, subTotal.toFixed(2))
                : 0}
            </td>
          </tr>
          <tr className="border-b-2 border-border pb-5">
            {discount ? (
              <td className="py-2 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
                <label className="cursor-pointer" htmlFor="Discount">
                  Discount
                </label>
              </td>
            ) : (
              <td className="cursor-pointer pt-2 pr-4 pb-3 text-right text-xs font-bold tracking-widest text-primary sm:pr-10">
                <label className="cursor-pointer" htmlFor="Discount">
                  ADD DISCOUNT
                </label>
              </td>
            )}
            <td className="pb-1 text-right">
              <input
                className="focusPadding focus:outline-none w-20 cursor-pointer rounded bg-transparent py-1 text-right text-base font-bold text-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
                id="Discount"
                type="text"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                onKeyDown={e => onEnter(e, "Discount")}
              />
            </td>
          </tr>
          <tr className="cursor-pointer">
            <td className="pt-4 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              <label className="cursor-pointer" htmlFor="Tax">
                Tax
              </label>
            </td>
            <td className="w-22 pt-4 text-right text-base font-bold text-foreground">
              <input
                className="focusPadding focus:outline-none w-20 cursor-pointer rounded bg-transparent py-1 text-right text-base font-bold text-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
                id="Tax"
                type="text"
                value={tax}
                onChange={e => setTax(e.target.value)}
                onKeyDown={e => onEnter(e, "Tax")}
              />
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              Total
            </td>
            <td className="text-right text-base font-bold text-foreground">
              {total ? currencyFormat(clientCurrency, total) : 0}
            </td>
          </tr>
          {currency !== clientCurrency && (
            <tr className="border-b-2 border-border pb-5">
              {baseCurrencyAmount ? (
                <td className="py-2 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
                  <label className="cursor-pointer" htmlFor="baseCurrency">
                    Amount in {currency}
                  </label>
                </td>
              ) : (
                <td className="cursor-pointer pt-2 pr-4 pb-3 text-right text-xs font-bold tracking-widest text-primary sm:pr-10">
                  <label className="cursor-pointer" htmlFor="baseCurrency">
                    ADD AMOUNT IN {currency}
                  </label>
                </td>
              )}
              <td className="pb-1 text-right">
                <input
                  className="focusPadding focus:outline-none w-20 cursor-pointer rounded bg-transparent py-1 text-right text-base font-bold text-foreground focus:border-border focus:bg-white focus:ring-1 focus:ring-ring"
                  id="baseCurrency"
                  type="text"
                  value={baseCurrencyAmount}
                  onChange={e => setBaseCurrencyAmount(e.target.value)}
                  onKeyDown={e => onEnter(e, "baseCurrency")}
                />
              </td>
            </tr>
          )}
          <tr>
            <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              Amount Paid
            </td>
            <td className="text-right text-base font-bold text-foreground ">
              {amountPaid ? currencyFormat(clientCurrency, amountPaid) : 0}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-4 text-right text-base font-normal text-foreground sm:pr-10">
              Amount Due
            </td>
            <td className="text-right text-base font-bold text-foreground">
              {amountDue ? currencyFormat(clientCurrency, amountDue) : 0}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTotal;
