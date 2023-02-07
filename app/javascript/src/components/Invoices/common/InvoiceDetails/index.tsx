import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";

import CustomDatePicker from "common/CustomDatePicker";

import ClientSelection from "./ClientSelection";

const InvoiceDetails = ({
  currency,
  clientList,
  amount,
  selectedClient,
  setSelectedClient,
  issueDate,
  setIssueDate,
  dueDate,
  setDueDate,
  invoiceNumber,
  setInvoiceNumber,
  reference,
  setReference,
  optionSelected,
  clientVisible,
}) => {
  const [showDateOfIssuePicker, setShowDateOfIssuePicker] =
    useState<boolean>(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  const getIssuedDate = dayjs(issueDate).format("DD.MM.YYYY");
  const getDueDate = dayjs(dueDate).format("DD.MM.YYYY");

  const handleDatePickerChange = date => {
    setIssueDate(date);
    setShowDateOfIssuePicker(false);
    const newDueDate = new Date(date);
    setDueDate(new Date(newDueDate.setMonth(newDueDate.getMonth() + 1)));
  };

  const handleDueDatePicker = date => {
    setDueDate(date);
    setShowDueDatePicker(false);
  };

  return (
    <div className="flex w-full flex-col justify-between border-b-2 border-miru-gray-400 px-5 py-5 md:h-36 md:flex-row md:px-10">
      <ClientSelection
        clientList={clientList}
        clientVisible={clientVisible}
        optionSelected={optionSelected}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
      />
      <div className="w-3/12">
        <div className="flex flex-col" ref={wrapperRef}>
          <p className="text-xs font-normal text-miru-dark-purple-1000">
            Invoice Number
          </p>
          <input
            className="w-3/5 bg-transparent text-xs focus:bg-white"
            data-cy="invoice-number"
            placeholder="Enter value"
            type="text"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <p className="mt-4 text-xs font-normal text-miru-dark-purple-1000">
            Reference
          </p>
          <input
            className="w-3/5 bg-transparent text-xs focus:bg-white"
            data-cy="invoice-reference"
            placeholder="Enter value (e.g. PO #)"
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        </div>
      </div>
      <div className="group w-3/12">
        <div className="hoverPencil relative cursor-pointer">
          <span
            className="flex text-xs font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
          >
            Date of Issue
          </span>
          <p
            className="text-base font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
          >
            {getIssuedDate}
          </p>
          {showDateOfIssuePicker && (
            <CustomDatePicker
              date={issueDate}
              handleChange={handleDatePickerChange}
              setVisibility={setShowDateOfIssuePicker}
            />
          )}
        </div>
        <div className="hoverPencil cursor-pointer">
          <span
            className="mt-4 flex text-xs font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDueDatePicker(!showDueDatePicker)}
          >
            Due Date
          </span>
          <p
            className="text-base font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDueDatePicker(!showDueDatePicker)}
          >
            {getDueDate}
          </p>
          {showDueDatePicker && (
            <CustomDatePicker
              date={dueDate}
              handleChange={handleDueDatePicker}
              setVisibility={setShowDueDatePicker}
            />
          )}
        </div>
      </div>
      <div className="w-2/12">
        <p className="text-right text-xs font-normal text-miru-dark-purple-1000 md:text-right">
          Amount
        </p>
        <p className="mt-6 text-right text-4xl font-normal text-miru-dark-purple-1000">
          {amount ? currencyFormat(currency, amount) : 0}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
