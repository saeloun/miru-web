import React, { useState, useRef } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { CalendarIcon } from "miruIcons";

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
    <div className="flex w-full flex-col gap-4 border-b border-border px-5 py-5 md:px-10 lg:h-40 lg:flex-row lg:items-stretch lg:gap-0">
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
      <div className="flex w-full flex-col gap-3 sm:w-1/2 lg:mr-2 lg:w-2/12 lg:gap-0">
        <CustomInputText
          id="invoiceNumber"
          inputBoxClassName="border focus:border-primary cursor-pointer"
          label="Invoice Number"
          labelClassName="cursor-pointer"
          name="invoiceNumber"
          type="text"
          value={invoiceNumber}
          onChange={handleInvoiceNumberChange}
        />
        <CustomInputText
          id="Reference"
          inputBoxClassName="focus:border-primary cursor-pointer"
          label="Reference"
          labelClassName="cursor-pointer"
          name="Reference"
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-1/2 lg:ml-2 lg:w-2/12 lg:gap-0">
        <div
          className="relative w-full cursor-pointer"
          ref={DateOfIssueWrapper}
        >
          <div onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}>
            <CustomInputText
              readOnly
              id="Date of Issue"
              inputBoxClassName="focus:border-primary cursor-pointer pr-9 truncate"
              label="Date of Issue"
              name="Date of Issue"
              type="text"
              value={getIssuedDate}
              onChange={handleDatePickerChange}
            />
            <CalendarIcon
              className="absolute top-4 right-4"
              color="#5E58F1"
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
        <div className="relative w-full cursor-pointer" ref={DueDateWrapper}>
          <div onClick={() => setShowDueDatePicker(!showDueDatePicker)}>
            <CustomInputText
              readOnly
              id="Due Date"
              inputBoxClassName="focus:border-primary cursor-pointer pr-9 truncate"
              label="Due Date"
              name="Due Date"
              type="text"
              value={getDueDate}
              onChange={handleDueDatePicker}
            />
            <CalendarIcon
              className="absolute top-4 right-4"
              color="#5E58F1"
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
      <div className="w-full pt-1 lg:w-4/12 lg:pl-4">
        <p className="text-left text-xs font-normal text-foreground lg:text-right">
          Amount
        </p>
        <p className="mt-2 text-left text-2xl font-normal tracking-tight text-foreground lg:mt-6 lg:text-right">
          {currencyFormat(clientCurrency, amount)}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
