import React, { useState } from "react";

import dayjs from "dayjs";
import { PaperPlaneTilt, Pen, Trash, DotsThreeVertical, Printer } from "phosphor-react";
import { Link } from "react-router-dom";

import CustomAvatar from "common/CustomAvatar";
import CustomCheckbox from "common/CustomCheckbox";
import { currencyFormat } from "helpers/currency";
import getStatusCssClass from "utils/getStatusTag";

import SendInvoice from "../SendInvoice";

const TableRow = ({
  invoice,
  isSelected,
  selectInvoices,
  deselectInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete
}) => {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleCheckboxChange = () => {
    if (isSelected) {
      deselectInvoices([invoice.id]);
    } else {
      selectInvoices([invoice.id]);
    }
  };

  const formattedAmount = currencyFormat({
    baseCurrency: invoice.company.baseCurrency,
    amount: invoice.amount
  });

  const formattedDate = (date) =>
    dayjs(date).format(invoice.company.dateFormat);

  return (
    <tr className="last:border-b-0 hover:bg-miru-gray-100 group">
      <td className="pl-6 py-5">
        <CustomCheckbox
          text=""
          handleCheck={handleCheckboxChange}
          isChecked={isSelected}
          checkboxValue={isSelected}
          id={invoice.id}
        />
      </td>

      <td className="w-1/5 pr-2 py-5 font-medium tracking-wider flex text-left">
        <CustomAvatar/>
        <div className="ml-10">
          <Link
            className="font-semibold capitalize text-miru-dark-purple-1000"
            to={`/invoices/${invoice.id}`}
          >
            {invoice.client.name}
          </Link>
          <h3 className="text-sm font-normal text-miru-dark-purple-400">
            {invoice.invoiceNumber}
          </h3>
        </div>
      </td>

      <td className="w-1/4 px-6 py-5 font-medium tracking-wider text-left">
        <h1 className="font-semibold text-miru-dark-purple-1000">
          {formattedDate(invoice.issueDate)}
        </h1>
        <h3 className="text-sm font-normal text-miru-dark-purple-400">
          Due on {formattedDate(invoice.dueDate)}
        </h3>
      </td>

      <td className="w-1/4 px-6 pt-2 pb-7 text-xl font-bold tracking-wider text-miru-dark-purple-1000 text-right ">
        {formattedAmount}
      </td>

      <td className="font-medium pb-10 px-6 relative text-right">
        <div className="hidden group-hover:flex p-3 w-40 bottom-16 left-24 absolute bg-white border-miru-gray-200 flex items-center justify-between rounded-xl border-2">
          <button
            className="text-miru-han-purple-1000"
            onClick={() => setIsSending(!isSending)}
          >
            <PaperPlaneTilt size={16} />
          </button>
          <Link
            to={`/invoices/${invoice.id}/edit`}
            type="button"
            data-cy="edit-invoice"
            className="text-miru-han-purple-1000"
          >
            <Pen size={16} />
          </Link>
          <button className="text-miru-han-purple-1000"
            onClick={() => {
              setShowDeleteDialog(true);
              setInvoiceToDelete(invoice.id);
            }}>
            <Trash size={16} />
          </button>
          <button className="text-miru-han-purple-1000"
            onClick={()=> setIsMenuOpen(true)}>
            <DotsThreeVertical size={16} />
          </button>
        </div>
        {
          isMenuOpen && <>
            <div className="border-x-4 border-b-8 border-black"></div>
            <ul onMouseLeave={()=> setIsMenuOpen(false)} className=" group-hover:flex flex-col z-10 p-4 absolute top-5 right-8 bg-white border-2 border-miru-gray-200">
              <li className="flex items-center">
                <Printer size={16} className="mr-4 text-miru-han-purple-1000"/>
              Print
              </li>
              <li
                onClick={() => {
                  setShowDeleteDialog(true);
                  setInvoiceToDelete(invoice.id);
                }}
                className="flex items-center">
                <Trash size={16} className="mr-4 text-miru-han-purple-1000"/>
              Delete
              </li>
              <li className="flex items-center"> <PaperPlaneTilt size={16} className="mr-4 text-miru-han-purple-1000"/> Send via link</li>
            </ul>
          </>
        }
        <span className={getStatusCssClass(invoice.status) + " uppercase"}>
          {invoice.status}
        </span>
      </td>
      {isSending && (
        <SendInvoice invoice={invoice} setIsSending={setIsSending} isSending />
      )}
    </tr>
  );
};

export default TableRow;
