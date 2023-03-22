import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { CalendarIcon } from "miruIcons";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";

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

  const getIssuedDate = dayjs(issueDate).format(dateFormat);
  const getDueDate = dayjs(dueDate).format(dateFormat);

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
    <div className="flex w-full flex-col justify-between border-b border-miru-gray-400 px-5 py-5 md:h-40 md:flex-row md:px-10">
      <ClientSelection
        clientList={clientList}
        clientVisible={clientVisible}
        optionSelected={optionSelected}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
      />
      <div className="mr-2 flex w-2/12 flex-col justify-between">
        <CustomInputText
          dataCy="Invoice Number"
          id="invoiceNumber"
          inputBoxClassName="border focus:border-miru-han-purple-1000"
          label="Invoice Number"
          name="Invoice Number"
          type="text"
          value={invoiceNumber}
          onChange={e => setInvoiceNumber(e.target.value)}
        />
        <CustomInputText
          dataCy="Reference"
          id="Reference"
          inputBoxClassName="focus:border-miru-han-purple-1000"
          label="Reference"
          name="Reference"
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
      </div>
      <div className="ml-2 flex w-2/12 flex-col justify-between">
        <div
          className="relative w-fit cursor-pointer"
          ref={DateOfIssueWrapper}
          onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}
        >
          <CustomInputText
            readOnly
            dataCy="Date of Issue"
            id="Date of Issue"
            inputBoxClassName="focus:border-miru-han-purple-1000"
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
          className="relative w-fit cursor-pointer"
          ref={DueDateWrapper}
          onClick={() => setShowDueDatePicker(!showDueDatePicker)}
        >
          <CustomInputText
            readOnly
            dataCy="Due Date"
            id="Due Date"
            inputBoxClassName="focus:border-miru-han-purple-1000"
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
      <div className="w-4/12 pl-4">
        <p className="text-right text-xs font-normal text-miru-dark-purple-1000 md:text-right">
          Amount
        </p>
        <p className="mt-6 text-right text-4xl font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, amount)}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
