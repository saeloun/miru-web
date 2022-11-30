import React, { useState } from "react";

import dayjs from "dayjs";
import { currencyFormat, useDebounce } from "helpers";
import {
  PaperPlaneTiltIcon,
  PenIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
} from "miruIcons";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Tooltip } from "StyledComponents";

import CustomCheckbox from "common/CustomCheckbox";
import getStatusCssClass from "utils/getBadgeStatus";

import { handleDownloadInvoice } from "../../common/utils";
import MoreOptions from "../MoreOptions";
import SendInvoice from "../SendInvoice";

const TableRow = ({
  invoice,
  isSelected,
  selectInvoices,
  deselectInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete,
  fetchInvoices,
}) => {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  useDebounce(isMenuOpen, 500);
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
    amount: invoice.amount,
  });

  const formattedDate = date => dayjs(date).format(invoice.company.dateFormat);

  return (
    <tr className="group last:border-b-0 hover:bg-miru-gray-100">
      <td className="px-4 py-5 md:pl-6 md:pr-0">
        <CustomCheckbox
          checkboxValue={isSelected}
          handleCheck={handleCheckboxChange}
          id={invoice.id}
          isChecked={isSelected}
          text=""
        />
      </td>
      <td
        className="flex cursor-pointer items-center whitespace-nowrap py-5 pr-6 text-left font-medium tracking-wider md:w-1/5 md:pr-2"
        onClick={() => navigate(`/invoices/${invoice.id}`)}
      >
        <Avatar />
        <div className="ml-2 md:ml-10">
          <span className="text-xs font-normal capitalize text-miru-dark-purple-1000 md:text-base md:font-semibold">
            {invoice.client.name}
          </span>
          <h3 className="text-xs font-normal text-miru-dark-purple-400 md:text-sm">
            {invoice.invoiceNumber}
          </h3>
        </div>
      </td>
      <td className="w-1/4 whitespace-nowrap px-4 py-5 font-medium tracking-wider md:px-6">
        <h1 className="text-xs font-normal text-miru-dark-purple-1000 md:text-base md:font-semibold">
          {formattedDate(invoice.issueDate)}
        </h1>
        <h3 className="text-xs font-normal text-miru-dark-purple-400 md:text-sm">
          Due on {formattedDate(invoice.dueDate)}
        </h3>
      </td>
      <td className="px-6 pt-2 pb-7 text-right text-sm font-bold tracking-wider text-miru-dark-purple-1000 md:w-1/4 md:text-xl">
        {formattedAmount}
      </td>
      <td
        className="relative px-6 pb-10 text-right font-medium"
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div className="absolute bottom-16 left-24 flex hidden w-40 items-center justify-between rounded-xl border-2 border-miru-gray-200 bg-white p-3 group-hover:flex">
          <Tooltip content="Send To">
            <button
              className="text-miru-han-purple-1000"
              onClick={() => setIsSending(!isSending)}
            >
              <PaperPlaneTiltIcon size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Download">
            <button
              disabled={invoice.status == "draft"}
              className={
                invoice.status == "draft"
                  ? "text-miru-gray-1000"
                  : "text-miru-han-purple-1000"
              }
              onClick={() => handleDownloadInvoice(invoice)}
            >
              <DownloadSimpleIcon size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Edit">
            <Link
              className="text-miru-han-purple-1000"
              data-cy="edit-invoice"
              to={`/invoices/${invoice.id}/edit`}
              type="button"
            >
              <PenIcon size={16} />
            </Link>
          </Tooltip>
          <Tooltip content="More">
            <button
              className="text-miru-han-purple-1000"
              onClick={() => setIsMenuOpen(true)}
            >
              <DotsThreeVerticalIcon size={16} />
            </button>
          </Tooltip>
        </div>
        {isMenuOpen && (
          <MoreOptions
            invoice={invoice}
            isMenuOpen={isMenuOpen}
            setInvoiceToDelete={setInvoiceToDelete}
            setIsMenuOpen={setIsMenuOpen}
            setShowDeleteDialog={setShowDeleteDialog}
          />
        )}
        <Badge
          className={`${getStatusCssClass(invoice.status)} uppercase`}
          text={invoice.status}
        />
      </td>
      {isSending && (
        <SendInvoice
          isSending
          fetchInvoices={fetchInvoices}
          invoice={invoice}
          setIsSending={setIsSending}
        />
      )}
    </tr>
  );
};

export default TableRow;
