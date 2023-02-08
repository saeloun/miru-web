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
  const DueDateWrapper = useRef(null);
  const DateOfIssueWrapper = useRef(null);

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
        <div className="hoverPencil flex flex-col">
          <label className="flex" htmlFor="invoiceNumber">
            <span className="text-xs font-normal text-miru-dark-purple-1000">
              Invoice Number
            </span>
            <button
              className="invisible ml-2"
              onClick={() => {
                document.getElementById("invoiceNumber").focus();
              }}
            >
              <EditIcon color="#7C5DEE" size={13} />
            </button>
          </label>
          <input
            className="focusPadding focus:bg-text-base focus:outline-none w-3/5 rounded bg-transparent text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
            data-cy="invoice-number"
            id="invoiceNumber"
            placeholder="Enter invoice number"
            type="text"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
          />
        </div>
        <div className="hoverPencil flex flex-col ">
          <label className="mt-4 flex" htmlFor="referenceNumber">
            <span className="text-xs font-normal text-miru-dark-purple-1000">
              Reference
            </span>
            <button
              className="invisible ml-2"
              onClick={() => {
                document.getElementById("referenceNumber").focus();
              }}
            >
              <EditIcon color="#7C5DEE" size={13} />
            </button>
          </label>
          <input
            className="focusPadding focus:bg-text-base focus:outline-none w-3/5 rounded bg-transparent text-miru-dark-purple-1000 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
            data-cy="invoice-reference"
            id="referenceNumber"
            placeholder="Enter reference"
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        </div>
      </div>
      <div className="group w-3/12">
        <div
          className="hoverPencil relative w-fit cursor-pointer pr-4"
          ref={DateOfIssueWrapper}
          onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
        >
          <p className="flex text-xs font-normal text-miru-dark-purple-1000">
            <span>Date of Issue</span>
            <button className="invisible ml-2">
              <EditIcon color="#7C5DEE" size={13} />
            </button>
          </p>
          <p className="text-base font-normal text-miru-dark-purple-1000">
            {getIssuedDate}
          </p>
          {showDateOfIssuePicker && (
            <CustomDatePicker
              date={issueDate}
              handleChange={handleDatePickerChange}
              setVisibility={setShowDateOfIssuePicker}
              wrapperRef={DateOfIssueWrapper}
            />
          )}
        </div>
        <div
          className="hoverPencil w-fit cursor-pointer pr-4"
          ref={DueDateWrapper}
          onClick={() => setShowDueDatePicker(!showDueDatePicker)}
        >
          <p className="mt-4 flex text-xs font-normal text-miru-dark-purple-1000">
            <span>Due Date</span>
            <button className="invisible ml-2">
              <EditIcon color="#7C5DEE" size={13} />
            </button>
          </p>
          <p className="text-base font-normal text-miru-dark-purple-1000">
            {getDueDate}
          </p>
          {showDueDatePicker && (
            <CustomDatePicker
              date={dueDate}
              handleChange={handleDueDatePicker}
              setVisibility={setShowDueDatePicker}
              wrapperRef={DueDateWrapper}
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
