import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { EditIcon } from "miruIcons";

import { sections } from "../../utils";

const InvoiceInfo = ({
  selectedClient,
  currency,
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
  const { name, phone, label } = selectedClient;
  const { address_line_1, address_line_2, city, state, country, pin } =
    selectedClient?.address ?? {};

  return (
    <div className="flex flex-col items-start justify-between border-b border-border px-4 py-2">
      <div>
        <span className="text-xs font-normal text-foreground">Billed to</span>
        <p className="mt-1 text-base font-bold text-foreground">
          {name || label}
        </p>
        <p className="text-xs font-normal text-muted-foreground">
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
        <div className="flex w-1/2 flex-col items-start justify-between pr-2">
          <span className="text-xs font-normal text-foreground">
            Date of Issue
          </span>
          <span className="text-base font-normal leading-5 text-foreground">
            {dayjs(issueDate, dateFormat).format(dateFormat)}
          </span>
        </div>
        <div className="flex w-1/2 flex-col items-start justify-between pl-2">
          <span className="text-xs font-normal text-foreground">
            Invoice Number
          </span>
          <span className="text-base font-normal leading-5 text-foreground">
            {invoiceNumber}
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full items-center justify-between">
        <div className="flex w-1/2 flex-col items-start justify-between pr-2">
          <span className="text-xs font-normal text-foreground">Due Date</span>
          <span className="text-base font-normal leading-5 text-foreground">
            {dayjs(dueDate, dateFormat).format(dateFormat)}
          </span>
        </div>
        <div className="flex w-1/2 flex-col items-start justify-between pl-2">
          <span className="text-xs font-normal text-foreground">Reference</span>
          <span className="text-base font-normal leading-5 text-foreground">
            {reference}
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col items-start justify-between">
        <span className="text-xs font-normal text-foreground">Amount</span>
        <span
          className={`mt-1 text-2xl font-semibold leading-8 text-foreground ${strikeAmount}`}
        >
          {currencyFormat(currency, amount)}
        </span>
      </div>
      {showEditButton && (
        <div
          className="mt-2 flex w-full items-center justify-center px-4 py-3 text-primary sm:px-12"
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
