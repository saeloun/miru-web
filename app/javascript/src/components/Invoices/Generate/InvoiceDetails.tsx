import React, { useState, useRef } from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { PencilSimple } from "phosphor-react";

import CustomDatePicker from "common/CustomDatePicker";

import ClientSelection from "./ClientSelection";

const InvoiceDetails = ({
  currency,
  clientList,
  selectedClient, setSelectedClient,
  amount,
  issueDate, setIssueDate,
  dueDate, setDueDate,
  invoiceNumber,
  setInvoiceNumber,
  reference,
  optionSelected, clientVisible
}) => {

  const [showDateOfIssuePicker, setShowDateOfIssuePicker] = useState<boolean>(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  const getIssuedDate = dayjs(issueDate).format("DD.MM.YYYY");
  const getDueDate = dayjs(dueDate).format("DD.MM.YYYY");

  const handleDatePickerChange = (date) => {
    setIssueDate(date);
    setShowDateOfIssuePicker(false);
    const newDueDate = new Date(date);
    setDueDate(new Date(newDueDate.setMonth(newDueDate.getMonth() + 1)));
  };

  const handleDueDatePicker = (date) => {
    setDueDate(date);
    setShowDueDatePicker(false);
  };

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <ClientSelection
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientList={clientList}
        optionSelected={optionSelected}
        clientVisible={clientVisible}
      />
      <div className="group">
        <div className="hoverPencil">
          <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
            <span>Date of Issue</span>
            <button className="ml-2 invisible" onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}>
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          </p>
          {showDateOfIssuePicker && <CustomDatePicker handleChange={handleDatePickerChange} date={issueDate} />}
          <p className="font-normal text-base text-miru-dark-purple-1000">
            {getIssuedDate}
          </p>
        </div>
        <div className="hoverPencil">
          <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4 flex">
            <span>Due Date</span>
            <button className="ml-2 invisible" onClick={() => setShowDueDatePicker(!showDueDatePicker)}>
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          </p>
          {showDueDatePicker && <CustomDatePicker handleChange={handleDueDatePicker} date={dueDate} />}
          <p className="font-normal text-base text-miru-dark-purple-1000">
            {getDueDate}
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-col" ref={wrapperRef}>
          <p className="font-normal text-xs text-miru-dark-purple-1000">
            Invoice Number
          </p>
          <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="px-2 w-3/5" data-cy="invoice-number"/>
        </div>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
          Reference
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {reference}
        </p>
      </div>

      <div>
        <p className="font-normal text-xs text-miru-dark-purple-1000 text-right">
          Amount
        </p>
        <p className="font-normal text-4xl text-miru-dark-purple-1000 mt-6">
          {currencyFormat({ baseCurrency: currency, amount: amount })}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
