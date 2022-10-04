import React, { useState, useEffect } from "react";

import { currencyFormat } from "helpers";
import { PencilSimple, DotsThreeVertical } from "phosphor-react";

import DiscountMenu from "../Generate/DiscountMenu";

// TODO: Make invoice total as common component and move logic to main container
const InvoiceTotal = ({
  currency,
  newLineItems,
  manualEntryArr,
  amountPaid,
  amountDue, setAmountDue,
  setAmount,
  discount, setDiscount,
  tax, setTax,
  showDiscountInput, showTax
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
      }
      else {
        setShowTaxInput(false);
      }
    }
  };

  const getDiscount = () => {
    if (showDiscount && discount) {
      return (
        <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
          {currencyFormat({ baseCurrency: currency, amount: parseFloat(discount).toFixed(2) })}
        </td>
      );
    }
    else if (addDiscount) {
      return (
        <td className="text-right pb-1">
          <input
            type="text"
            value={discount}
            className="p-1 pr-2 font-medium text-sm text-miru-dark-purple-1000 text-right w-20 rounded focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            onChange={(e) => setDiscount(e.target.value)}
            onKeyDown={e => onEnter(e, "Discount")}
          />
        </td>
      );
    }
    else return null;
  };

  const getTax = () => {
    if (showTaxInput) {
      return (
        <td className="pt-4 font-bold text-base text-miru-dark-purple-1000 text-right w-22">
          <input
            type="text"
            value={tax}
            className="p-1 pr-2 font-medium text-sm text-miru-dark-purple-1000 text-right w-20 rounded focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
            onChange={(e) => setTax(e.target.value)}
            onKeyDown={e => onEnter(e, "Tax")}
          />
        </td>
      );
    }

    return (
      <td className="pt-4 font-bold text-base text-miru-dark-purple-1000 text-right w-22">
        {currencyFormat({ baseCurrency: currency, amount: tax })}
      </td>
    );
  };

  useEffect(() => {
    const newLineItemsSubTotalArr = newLineItems
      .filter((lineItem) => !lineItem._destroy );

    const newLineItemsSubTotal = newLineItemsSubTotalArr.reduce((sum, { lineTotal }) => (sum + Number(lineTotal)), 0);
    const manualEntryTotal = manualEntryArr.reduce((sum, { lineTotal }) => (sum + Number(lineTotal)), 0);
    const subTotal = Number(newLineItemsSubTotal) + Number(manualEntryTotal);
    const newTotal = subTotal + Number(tax) - Number(discount);
    setSubTotal(subTotal);
    setTotal(newTotal);
    setAmount(newTotal);
    setAmountDue(newTotal - amountPaid);
  }, [newLineItems, manualEntryArr, discount, subTotal, tax]);

  return (
    <div className="pt-3 pb-10 mb-5 w-full flex justify-end">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Sub total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {currencyFormat({ baseCurrency: currency, amount: subTotal.toFixed(2) })}
            </td>
          </tr>
          <tr
            onMouseOver={() => setShowDiscountButton(true)}
            onMouseLeave={() => setShowDiscountButton(false)}
            className="pb-5 border-b-2 miru-gray-400 ">
            {showDiscount && discount
              ? <td className="py-2 pr-10 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
                Discount
              </td>
              : <td className="pt-2 pr-10 pb-3 font-bold text-xs text-miru-han-purple-1000 text-right tracking-widest cursor-pointer" onClick={() => setAddDiscount(true)}>
                ADD DISCOUNT
              </td>
            }
            {
              getDiscount()
            }
          </tr>
          <tr
            onMouseOver={() => setShowEditTaxButton(true)}
            onMouseLeave={() => setShowEditTaxButton(false)}
          >
            <td className="pt-4 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Tax
            </td>
            {
              getTax()
            }
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {currencyFormat({ baseCurrency: currency, amount: total })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Amount Paid
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {currencyFormat({ baseCurrency: currency, amount: amountPaid })}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Amount Due
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {currencyFormat({ baseCurrency: currency, amount: amountDue })}
            </td>
          </tr>
          <tr>
            <td className="pt-2 font-bold text-xs text-miru-han-purple-1000 text-right tracking-widest pr-10">
              REQUEST DEPOSIT
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      {showDiscountMenu &&
        <DiscountMenu
          setShowDiscount={setShowDiscount}
          setShowDiscountMenu={setShowDiscountMenu}
          setAddDiscount={setAddDiscount}
          setDiscount={setDiscount}
        />
      }
      <div className="flex flex-col">
        <div
          onMouseOver={() => setShowDiscountButton(true)}
          onMouseLeave={() => setShowDiscountButton(false)}
          className="w-10">
          {showDiscountButton && <button
            className="bg-miru-gray-1000 rounded mt-8 mx-1 p-2"
            onClick={() => setShowDiscountMenu(!showDiscountMenu)}
          >
            <DotsThreeVertical size={13} color="#1D1A31" />
          </button>}
        </div>
        <div
          onMouseOver={() => setShowEditTaxButton(true)}
          onMouseLeave={() => setShowEditTaxButton(false)}
          className="w-10 mt-12">
          {showEditTaxButton && <button
            className="bg-miru-gray-1000 rounded mt-8 mx-1 p-2"
            onClick={() => {
              setShowTaxInput(true);
            }}
          >
            <PencilSimple size={13} color="#1D1A31" />
          </button>}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotal;
