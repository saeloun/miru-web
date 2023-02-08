import React, { useState, useEffect } from "react";

import { currencyFormat } from "helpers";
import { DeleteIcon } from "miruIcons";

const InvoiceTotal = ({
  currency,
  newLineItems,
  amountPaid,
  amountDue,
  setAmountDue,
  setAmount,
  discount,
  setDiscount,
  tax,
  setTax,
  manualEntryArr,
}) => {
  const [showDiscountDeleteButton, setShowDiscountDeleteButton] =
    useState<boolean>(false);

  const [showDeleteTaxButton, setShowDeleteTaxButton] =
    useState<boolean>(false);
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
    <div className="mb-5 flex w-full justify-end pt-3 pb-10">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Sub total
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
              {subTotal ? currencyFormat(currency, subTotal.toFixed(2)) : 0}
            </td>
          </tr>
          <tr
            className="miru-gray-400 border-b-2 pb-5"
            onMouseLeave={() => setShowDiscountDeleteButton(false)}
            onMouseOver={() => setShowDiscountDeleteButton(true)}
          >
            {discount ? (
              <td className="py-2 pr-10 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
                <label className="cursor-pointer" htmlFor="Discount">
                  Discount
                </label>
              </td>
            ) : (
              <td className="cursor-pointer pt-2 pr-10 pb-3 text-right text-xs font-bold tracking-widest text-miru-han-purple-1000">
                <label className="cursor-pointer" htmlFor="Discount">
                  ADD DISCOUNT
                </label>
              </td>
            )}
            <td className="pb-1 text-right">
              <input
                className="focus:outline-none w-20 cursor-pointer rounded bg-transparent p-1 text-right text-base font-bold text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
                id="Discount"
                type="text"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                onKeyDown={e => onEnter(e, "Discount")}
              />
            </td>
          </tr>
          <tr
            className="cursor-pointer"
            onMouseLeave={() => setShowDeleteTaxButton(false)}
            onMouseOver={() => setShowDeleteTaxButton(true)}
          >
            <td className="pt-4 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              <label className="cursor-pointer" htmlFor="Tax">
                Tax
              </label>
            </td>
            <td className="w-22 pt-4 text-right text-base font-bold text-miru-dark-purple-1000">
              <input
                className="focus:outline-none w-20 cursor-pointer rounded bg-transparent p-1 text-right text-base font-bold text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
                id="Tax"
                type="text"
                value={tax}
                onChange={e => setTax(e.target.value)}
                onKeyDown={e => onEnter(e, "Tax")}
              />
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Total
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000">
              {total ? currencyFormat(currency, total) : 0}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Amount Paid
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
              {amountPaid ? currencyFormat(currency, amountPaid) : 0}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Amount Due
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000">
              {amountDue ? currencyFormat(currency, amountDue) : 0}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex flex-col">
        <div
          className="w-10"
          onMouseLeave={() => setShowDiscountDeleteButton(false)}
          onMouseOver={() => setShowDiscountDeleteButton(true)}
        >
          {showDiscountDeleteButton && discount ? (
            <button
              className="mx-1 mt-8 rounded bg-miru-gray-1000 p-2"
              onClick={() => {
                setDiscount(0);
              }}
            >
              <DeleteIcon color="#E04646" size={13} />
            </button>
          ) : null}
        </div>
        <div
          className="mt-12 w-10"
          onMouseLeave={() => setShowDeleteTaxButton(false)}
          onMouseOver={() => setShowDeleteTaxButton(true)}
        >
          {showDeleteTaxButton && tax ? (
            <button
              className="mx-1 mt-9 rounded bg-miru-gray-1000 p-2"
              onClick={() => {
                setTax(0);
              }}
            >
              <DeleteIcon color="#E04646" size={13} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotal;
