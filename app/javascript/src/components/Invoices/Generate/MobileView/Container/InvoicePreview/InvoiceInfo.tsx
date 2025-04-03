import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { EditIcon } from "miruIcons";

import { sections } from "../../utils";

const InvoiceInfo = ({
  selectedClient,
  dueDate,
  issueDate,
  invoiceNumber,
  reference,
  amount,
  dateFormat,
  setActiveSection,
  showEditButton = true,
  strikeAmount = "",
}) => {
  const { name, phone, label, currency } = selectedClient;
  const { address_line_1, address_line_2, city, state, country, pin } =
    selectedClient?.address ?? {};

  return (
    <div className="flex flex-col items-start justify-between border-b border-miru-gray-400 px-4 py-2">
      <div>
        <span className="text-xs font-normal text-miru-dark-purple-1000">
          Billed to
        </span>
        <p className="mt-1 text-base font-bold text-miru-dark-purple-1000">
          {name || label}
        </p>
        <p className="text-xs font-normal text-miru-dark-purple-600">
          {selectedClient?.address
            ? `${address_line_1}${
                address_line_2 ? `, ${address_line_2}` : ""
              }\n${
                address_line_2 ? "," : ""
              }\n${city}, ${state}, ${country},\n${pin}`
            : "No address found"}
          <br />
          {phone}
        </p>
      </div>
      <div className="mt-4 flex w-full items-center justify-between">
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Date of Issue
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {dayjs(issueDate, dateFormat).format(dateFormat)}
          </span>
        </div>
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Invoice Number
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {invoiceNumber}
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full items-center justify-between">
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Due Date
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {dayjs(dueDate, dateFormat).format(dateFormat)}
          </span>
        </div>
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Reference
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {reference}
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col items-start justify-between">
        <span className="text-xs font-normal text-miru-dark-purple-1000">
          Amount
        </span>
        <span
          className={`mt-1 text-2xl font-semibold leading-8 text-miru-dark-purple-1000 ${strikeAmount}`}
        >
          {currencyFormat(currency, amount)}
        </span>
      </div>
      {showEditButton && (
        <div
          className="mt-2 flex w-full items-center justify-center py-3 px-12 text-miru-han-purple-1000"
          onClick={() => {
            setActiveSection(sections.generateInvoice);
          }}
        >
          <EditIcon className="mr-2" weight="bold" />
          <span className="text-xs font-bold">Edit Invoice Details</span>
        </div>
      )}
    </div>
  );
};

export default InvoiceInfo;
