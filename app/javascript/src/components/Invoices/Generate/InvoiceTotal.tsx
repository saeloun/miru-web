import React, { useState, useEffect } from "react";
import { PencilSimple, DotsThreeVertical, Trash } from "phosphor-react";

import DiscountMenu from "./DiscountMenu";

const InvoiceTotal = ({ newLineItems }) => {

  const [addDiscount, setAddDiscount] = useState<boolean>(false);
  const [showDiscountMenu, setShowDiscountMenu] = useState<boolean>(false);
  const [showDiscountButton, setShowDiscountButton] = useState<boolean>(false);
  const [showDiscount, setShowDiscount] = useState<boolean>(false);
  const [showTaxInput, setShowTaxInput] = useState<boolean>(false);
  const [showTax, setShowTax] = useState<boolean>(false);
  const [showEditTaxButton, setShowEditTaxButton] = useState<boolean>(false);

  const [discount, setDiscount] = useState<any>(null);
  const [tax, setTax] = useState<any>(null);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [amountDue, setAmountDue] = useState<number>(0);

  const onEnter = (e, type) => {
    if (e.key === "Enter") {
      if (type == "Discount") {
        setAddDiscount(false);
        setShowDiscount(true);
      }
      else if (type == "Tax") {
        setShowTax(true);
        setShowTaxInput(false);
      }
    }
  };

  useEffect(() => {
    let sum = 0;
    newLineItems.map(item => {
      sum = sum + item.lineTotal;
    });
    setSubTotal(sum);
  }, [newLineItems]);

  useEffect(() => {
    const Total = Number(subTotal) + Number(tax) - Number(discount);
    setTotal(Total);
  }, [discount, subTotal, tax]);

  useEffect(() => {
    const Due = total - amountPaid;
    setAmountDue(Due);
  }, [amountPaid, total]);

  return (
    <div className="pt-3 pb-10 mb-5 w-full flex justify-end">
      <table className="w-1/3">
        <tbody>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
                                          Sub total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {subTotal}
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
            {showDiscount && discount
              ? <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">{discount}</td>
              : addDiscount &&
                                          <td className="text-right pb-1">
                                            <input
                                              type="text"
                                              value={discount}
                                              className="p-1 pr-2 font-medium text-sm text-miru-dark-purple-1000 text-right w-20 rounded focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                                              onChange={(e) => setDiscount(e.target.value)}
                                              onKeyDown={e => onEnter(e, "Discount")}
                                            />
                                          </td>
            }
          </tr>
          <tr
            onMouseOver={() => setShowEditTaxButton(true)}
            onMouseLeave={() => setShowEditTaxButton(false)}
          >
            <td className="pt-4 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
                                          Tax
            </td>
            <td className="pt-4 font-bold text-base text-miru-dark-purple-1000 text-right w-22">
              {showTax && tax ?
                <p>{tax}</p>
                : showTaxInput ?
                  <input
                    type="text"
                    value={tax}
                    className="p-1 pr-2 font-medium text-sm text-miru-dark-purple-1000 text-right w-20 rounded focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
                    onChange={(e) => setTax(e.target.value)}
                    onKeyDown={e => onEnter(e, "Tax")}
                  />
                  : <p>$0</p>
              }

            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
                                          Total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {"$" + total}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
                                          Amount Paid
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              {"$" + amountPaid}
            </td>
          </tr>
          <tr>
            <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
                                          Amount Due
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              {"$" + amountDue}
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
              setTax(null);
              setShowTax(false);
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
