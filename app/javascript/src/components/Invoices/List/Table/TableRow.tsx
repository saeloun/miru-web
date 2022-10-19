import React, { useState } from "react";

import dayjs from "dayjs";
import { currencyFormat, useDebounce } from "helpers";
import {
  PaperPlaneTilt,
  Pen,
  DotsThreeVertical,
  DownloadSimple
} from "phosphor-react";
import { useNavigate, Link } from "react-router-dom";
import { Avatar, Badge, Tooltip } from "StyledComponents";

import CustomCheckbox from "common/CustomCheckbox";
import getStatusCssClass from "utils/getBadgeStatus";

import MoreOptions from "../MoreOptions";
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
  useDebounce(isMenuOpen,500);
  const navigate = useNavigate();

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
    <tr onClick={()=>navigate(`/invoices/${invoice.id}`)} className="last:border-b-0 hover:bg-miru-gray-100 group cursor-pointer">
      <td className="md:pl-6 md:pr-0 px-4 py-5">
        <CustomCheckbox
          text=""
          handleCheck={handleCheckboxChange}
          isChecked={isSelected}
          checkboxValue={isSelected}
          id={invoice.id}
          name=""
        />
      </td>

      <td className="md:w-1/5 md:pr-2 pr-6 py-5 font-medium tracking-wider flex items-center text-left whitespace-nowrap">
        <Avatar />
        <div className="md:ml-10 ml-2">
          <span
            className="md:font-semibold font-normal md:text-base text-xs capitalize text-miru-dark-purple-1000"
          >
            {invoice.client.name}
          </span>
          <h3 className="md:text-sm text-xs font-normal text-miru-dark-purple-400">
            {invoice.invoiceNumber}
          </h3>
        </div>
      </td>

      <td className="w-1/4 md:px-6 px-4 py-5 font-medium tracking-wider whitespace-nowrap">
        <h1 className="md:font-semibold md:text-base text-xs font-normal text-miru-dark-purple-1000">
          {formattedDate(invoice.issueDate)}
        </h1>
        <h3 className="md:text-sm text-xs font-normal text-miru-dark-purple-400">
          Due on {formattedDate(invoice.dueDate)}
        </h3>
      </td>

      <td className="md:w-1/4 px-6 pt-2 pb-7 md:text-xl text-sm font-bold tracking-wider text-miru-dark-purple-1000 text-right">
        {formattedAmount}
      </td>

      <td
        onMouseLeave={() => setIsMenuOpen(false)}
        className="font-medium pb-10 px-6 relative text-right"
      >
        <div className="hidden group-hover:flex p-3 w-40 bottom-16 left-24 absolute bg-white border-miru-gray-200 flex items-center justify-between rounded-xl border-2">
          <Tooltip content="Send To">
            <button
              className="text-miru-han-purple-1000"
              onClick={() => setIsSending(!isSending)}
            >
              <PaperPlaneTilt size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Download">
            <button className="text-miru-han-purple-1000">
              <DownloadSimple size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Edit">
            <Link
              to={`/invoices/${invoice.id}/edit`}
              type="button"
              data-cy="edit-invoice"
              className="text-miru-han-purple-1000"
            >
              <Pen size={16} />
            </Link>
          </Tooltip>
          <Tooltip content="More">
            <button
              className="text-miru-han-purple-1000"
              onClick={() => setIsMenuOpen(true)}
            >
              <DotsThreeVertical size={16} />
            </button>
          </Tooltip>
        </div>
        {isMenuOpen && (
          <MoreOptions
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            setShowDeleteDialog={setShowDeleteDialog}
            setInvoiceToDelete={setInvoiceToDelete}
            invoice={invoice}
          />
        )}
        <Badge
          text={invoice.status}
          className={getStatusCssClass(invoice.status) + " uppercase"}
        />
      </td>
      {isSending && (
        <SendInvoice invoice={invoice} setIsSending={setIsSending} isSending />
      )}
    </tr>
  );
};

export default TableRow;
