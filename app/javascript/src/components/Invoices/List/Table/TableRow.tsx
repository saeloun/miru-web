import React, { useState } from "react";

import dayjs from "dayjs";
import { PaperPlaneTilt, Pen, Trash } from "phosphor-react";
import { Link } from "react-router-dom";

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
      <td className="px-6 py-5">
        <CustomCheckbox
          text=""
          handleCheck={handleCheckboxChange}
          isChecked={isSelected}
          checkboxValue={isSelected}
          id={invoice.id}
        />
      </td>

      <td className="w-2/4 md:px-6 px-2 py-5 font-medium tracking-wider">
        <Link
          className="md:font-semibold font-normal capitalize text-miru-dark-purple-1000"
          to={`/invoices/${invoice.id}`}
        >
          {invoice.client.name}
        </Link>
        <h3 className="text-sm font-normal text-miru-dark-purple-400">
          {invoice.invoiceNumber}
        </h3>
      </td>

      <td className="md:w-1/4 md:px-6 px-2 py-5 font-medium tracking-wider">
        <h1 className="md:font-semibold md:text-base text-xs font-normal text-miru-dark-purple-1000">
          {formattedDate(invoice.issueDate)}
        </h1>
        <h3 className="md:text-sm text-xs font-normal text-miru-dark-purple-400">
          Due on {formattedDate(invoice.dueDate)}
        </h3>
      </td>

      <td className="px-6 py-5 md:text-xl text-sm font-bold tracking-wider text-miru-dark-purple-1000">
        {formattedAmount}
      </td>

      <td className="px-6 py-5 font-medium">
        <span className={getStatusCssClass(invoice.status) + " uppercase"}>
          {invoice.status}
        </span>
      </td>

      <td className="px-2 py-4 text-sm font-medium text-right whitespace-nowrap">
        <div className="flex items-center h-full">
          <button
            className="hidden group-hover:block text-miru-han-purple-1000"
            onClick={() => setIsSending(!isSending)}
          >
            <PaperPlaneTilt size={16} />
          </button>
        </div>
      </td>

      <td className="px-2 py-4 text-sm font-medium text-right whitespace-nowrap">
        <div className="flex items-center h-full">
          <Link
            to={`/invoices/${invoice.id}/edit`}
            type="button"
            data-cy="edit-invoice"
            className="hidden group-hover:block text-miru-han-purple-1000"
          >
            <Pen size={16} />
          </Link>
        </div>
      </td>

      <td className="px-2 py-4 text-sm font-medium text-right whitespace-nowrap">
        {(invoice.status == "draft" || invoice.status == "declined") && (
          <div className="flex items-center h-full">
            <button className="hidden group-hover:block text-miru-han-purple-1000"
              onClick={() => {
                setShowDeleteDialog(true);
                setInvoiceToDelete(invoice.id);
              }}>
              <Trash size={16} />
            </button>
          </div>
        )}
      </td>

      {isSending && (
        <SendInvoice invoice={invoice} setIsSending={setIsSending} isSending />
      )}
    </tr>
  );
};

export default TableRow;
