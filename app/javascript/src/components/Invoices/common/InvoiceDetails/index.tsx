import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { EditIcon } from "miruIcons";

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
    <div className="flex flex-col justify-between border-b-2 border-miru-gray-400 px-5 py-5 md:h-36 md:flex-row md:px-10">
      <ClientSelection
        clientList={clientList}
        clientVisible={clientVisible}
        optionSelected={optionSelected}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
      />
      <div className="group">
        <div className="hoverPencil cursor-pointer">
          <p
            className="flex text-xs font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
          >
            <span>Date of Issue</span>
            <button className="invisible ml-2">
              <EditIcon color="#1D1A31" size={13} />
            </button>
          </p>
          {showDateOfIssuePicker && (
            <CustomDatePicker
              date={issueDate}
              handleChange={handleDatePickerChange}
              setVisibility={setShowDateOfIssuePicker}
            />
          )}
          <p
            className="text-base font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
          >
            {getIssuedDate}
          </p>
        </div>
        <div className="hoverPencil cursor-pointer">
          <p
            className="mt-4 flex text-xs font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDueDatePicker(!showDueDatePicker)}
          >
            <span>Due Date</span>
            <button className="invisible ml-2">
              <EditIcon color="#1D1A31" size={13} />
            </button>
          </p>
          {showDueDatePicker && (
            <CustomDatePicker
              date={dueDate}
              handleChange={handleDueDatePicker}
              setVisibility={setShowDueDatePicker}
            />
          )}
          <p
            className="text-base font-normal text-miru-dark-purple-1000"
            onClick={() => setShowDueDatePicker(!showDueDatePicker)}
          >
            {getDueDate}
          </p>
        </div>
      </div>
      <div>
        <div className="flex flex-col" ref={wrapperRef}>
          <p className="text-xs font-normal text-miru-dark-purple-1000">
            Invoice Number
          </p>
          <input
            className="w-3/5 px-2"
            data-cy="invoice-number"
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
            className="w-3/5 px-2"
            data-cy="invoice-reference"
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        </div>
      </div>
      <div>
        <p className="text-left text-xs font-normal text-miru-dark-purple-1000 md:text-right">
          Amount
        </p>
        <p className="mt-6 text-4xl font-normal text-miru-dark-purple-1000">
          {amount ? currencyFormat(currency, amount) : 0}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
