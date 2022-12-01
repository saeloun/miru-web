import React, { useState, useEffect } from "react";

import { currencyFormat } from "helpers";
import { EditIcon, DotsThreeVerticalIcon } from "miruIcons";

import DiscountMenu from "./DiscountMenu";

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
  showDiscountInput,
  showTax,
  manualEntryArr,
}) => {
  const [addDiscount, setAddDiscount] = useState<boolean>(false);
  const [showDiscountMenu, setShowDiscountMenu] = useState<boolean>(false);
  const [showDiscountButton, setShowDiscountButton] = useState<boolean>(false);
  const [showDiscount, setShowDiscount] = useState<boolean>(showDiscountInput);
  const [showTaxInput, setShowTaxInput] = useState<boolean>(showTax);
  const [showEditTaxButton, setShowEditTaxButton] = useState<boolean>(false);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const onEnter = (e, type) => {
    if (e.key === "Enter") {
      if (type === "Discount") {
        setAddDiscount(false);
        setShowDiscount(true);
      } else {
        setShowTaxInput(false);
      }
    }
  };

  const getDiscount = () => {
    if (showDiscount && discount) {
      return (
        <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
          {currencyFormat({
            baseCurrency: currency,
            amount: parseFloat(discount).toFixed(2),
          })}
        </td>
      );
    } else if (addDiscount) {
      return (
        <td className="pb-1 text-right">
          <input
            className="focus:outline-none w-20 rounded p-1 pr-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            type="text"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
            onKeyDown={e => onEnter(e, "Discount")}
          />
        </td>
      );
    }

    return null;
  };

  const getTax = () => {
    if (showTaxInput) {
      return (
        <td className="w-22 pt-4 text-right text-base font-bold text-miru-dark-purple-1000">
          <input
            className="focus:outline-none w-20 rounded p-1 pr-2 text-right text-sm font-medium text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            type="text"
            value={tax}
            onChange={e => setTax(e.target.value)}
            onKeyDown={e => onEnter(e, "Tax")}
          />
        </td>
      );
    }

    return (
      <td className="w-22 pt-4 text-right text-base font-bold text-miru-dark-purple-1000">
        {currencyFormat({ baseCurrency: currency, amount: tax })}
      </td>
    );
  };

  useEffect(() => {
    const newLineItemsSubTotalArr = newLineItems.filter(
      lineItem => !lineItem._destroy
    );

    const newLineItemsSubTotal = newLineItemsSubTotalArr.reduce(
      (sum, { lineTotal }) => sum + Number(lineTotal),
      0
    );

    const manualEntryTotalArr = manualEntryArr.filter(
      lineItem => !lineItem._destroy
    );

    const manualEntryTotal = manualEntryTotalArr.reduce(
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
              {subTotal
                ? currencyFormat({
                    baseCurrency: currency,
                    amount: subTotal.toFixed(2),
                  })
                : 0}
            </td>
          </tr>
          <tr
            className="miru-gray-400 border-b-2 pb-5 "
            onMouseLeave={() => setShowDiscountButton(false)}
            onMouseOver={() => setShowDiscountButton(true)}
          >
            {showDiscount && discount ? (
              <td className="py-2 pr-10 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
                Discount
              </td>
            ) : (
              <td
                className="cursor-pointer pt-2 pr-10 pb-3 text-right text-xs font-bold tracking-widest text-miru-han-purple-1000"
                onClick={() => setAddDiscount(true)}
              >
                ADD DISCOUNT
              </td>
            )}
            {getDiscount()}
          </tr>
          <tr
            onMouseLeave={() => setShowEditTaxButton(false)}
            onMouseOver={() => setShowEditTaxButton(true)}
          >
            <td className="pt-4 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Tax
            </td>
            {getTax()}
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Total
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000">
              {total
                ? currencyFormat({ baseCurrency: currency, amount: total })
                : 0}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Amount Paid
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000 ">
              {amountPaid
                ? currencyFormat({ baseCurrency: currency, amount: amountPaid })
                : 0}
            </td>
          </tr>
          <tr>
            <td className="pt-1 pr-10 text-right text-base font-normal text-miru-dark-purple-1000">
              Amount Due
            </td>
            <td className="text-right text-base font-bold text-miru-dark-purple-1000">
              {amountDue
                ? currencyFormat({ baseCurrency: currency, amount: amountDue })
                : 0}
            </td>
          </tr>
          <tr>
            <td className="pt-2 pr-10 text-right text-xs font-bold tracking-widest text-miru-han-purple-1000">
              REQUEST DEPOSIT
            </td>
            <td />
          </tr>
        </tbody>
      </table>
      {showDiscountMenu && (
        <DiscountMenu
          setAddDiscount={setAddDiscount}
          setDiscount={setDiscount}
          setShowDiscount={setShowDiscount}
          setShowDiscountMenu={setShowDiscountMenu}
        />
      )}
      <div className="flex flex-col">
        <div
          className="w-10"
          onMouseLeave={() => setShowDiscountButton(false)}
          onMouseOver={() => setShowDiscountButton(true)}
        >
          {showDiscountButton && (
            <button
              className="mx-1 mt-8 rounded bg-miru-gray-1000 p-2"
              onClick={() => setShowDiscountMenu(!showDiscountMenu)}
            >
              <DotsThreeVerticalIcon color="#1D1A31" size={13} />
            </button>
          )}
        </div>
        <div
          className="mt-12 w-10"
          onMouseLeave={() => setShowEditTaxButton(false)}
          onMouseOver={() => setShowEditTaxButton(true)}
        >
          {showEditTaxButton && (
            <button
              className="mx-1 mt-8 rounded bg-miru-gray-1000 p-2"
              onClick={() => {
                setShowTaxInput(true);
              }}
            >
              <EditIcon color="#1D1A31" size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotal;
