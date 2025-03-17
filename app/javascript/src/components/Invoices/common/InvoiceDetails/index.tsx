import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { CalendarIcon } from "miruIcons";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";

import ClientSelection from "./ClientSelection";

const InvoiceDetails = ({
  clientCurrency,
  setClientCurrency,
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
  dateFormat,
  setReference,
  optionSelected,
  clientVisible,
}) => {
  const [showDateOfIssuePicker, setShowDateOfIssuePicker] =
    useState<boolean>(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const DueDateWrapper = useRef(null);
  const DateOfIssueWrapper = useRef(null);

  const getIssuedDate = dayjs(issueDate, dateFormat).format(dateFormat);
  const getDueDate = dayjs(dueDate, dateFormat).format(dateFormat);

  const handleDatePickerChange = date => {
    setIssueDate(date);
    setShowDateOfIssuePicker(false);
    const parsedDate = dayjs(date, dateFormat);
    const newDueDate = parsedDate.add(1, "month").format(dateFormat);
    setDueDate(newDueDate);
  };

  const handleDueDatePicker = date => {
    setDueDate(date);
    setShowDueDatePicker(false);
  };

  const handleInvoiceNumberChange = e => {
    const result = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
    setInvoiceNumber(result);
  };

  return (
    <div className="flex w-full flex-col justify-between border-b border-miru-gray-400 px-5 py-5 md:h-40 md:flex-row md:px-10">
      <ClientSelection
        clientList={clientList}
        clientVisible={clientVisible}
        invoiceNumber={invoiceNumber}
        optionSelected={optionSelected}
        selectedClient={selectedClient}
        setClientCurrency={setClientCurrency}
        setInvoiceNumber={setInvoiceNumber}
        setSelectedClient={setSelectedClient}
      />
      <div className="mr-2 flex w-2/12 flex-col justify-between">
        <CustomInputText
          id="invoiceNumber"
          inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
          label="Invoice Number"
          labelClassName="cursor-pointer"
          name="invoiceNumber"
          type="text"
          value={invoiceNumber}
          onChange={handleInvoiceNumberChange}
        />
        <CustomInputText
          id="Reference"
          inputBoxClassName="focus:border-miru-han-purple-1000 cursor-pointer"
          label="Reference"
          labelClassName="cursor-pointer"
          name="Reference"
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
      </div>
      <div className="ml-2 flex w-2/12 flex-col justify-between">
        <div className="relative w-fit cursor-pointer" ref={DateOfIssueWrapper}>
          <div onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}>
            <CustomInputText
              readOnly
              id="Date of Issue"
              inputBoxClassName="focus:border-miru-han-purple-1000 cursor-pointer pr-9 truncate"
              label="Date of Issue"
              name="Date of Issue"
              type="text"
              value={getIssuedDate}
              onChange={handleDatePickerChange}
            />
            <CalendarIcon
              className="absolute top-4 right-4"
              color="#5B34EA"
              size={20}
              weight="bold"
            />
          </div>
          {showDateOfIssuePicker && (
            <CustomDatePicker
              date={issueDate}
              dateFormat={dateFormat}
              handleChange={handleDatePickerChange}
              setVisibility={setShowDateOfIssuePicker}
              wrapperRef={DateOfIssueWrapper}
            />
          )}
        </div>
        <div className="relative w-fit cursor-pointer" ref={DueDateWrapper}>
          <div onClick={() => setShowDueDatePicker(!showDueDatePicker)}>
            <CustomInputText
              readOnly
              id="Due Date"
              inputBoxClassName="focus:border-miru-han-purple-1000 cursor-pointer pr-9 truncate"
              label="Due Date"
              name="Due Date"
              type="text"
              value={getDueDate}
              onChange={handleDueDatePicker}
            />
            <CalendarIcon
              className="absolute top-4 right-4"
              color="#5B34EA"
              size={20}
              weight="bold"
            />
          </div>
          {showDueDatePicker && (
            <CustomDatePicker
              date={dueDate}
              dateFormat={dateFormat}
              handleChange={handleDueDatePicker}
              setVisibility={setShowDueDatePicker}
              wrapperRef={DueDateWrapper}
            />
          )}
        </div>
      </div>
      <div className="w-4/12 pl-4">
        <p className="text-right text-xs font-normal text-miru-dark-purple-1000 md:text-right">
          Amount
        </p>
        <p className="mt-6 text-right text-4xl font-normal text-miru-dark-purple-1000">
          {currencyFormat(clientCurrency, amount)}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
