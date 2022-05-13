import React, { useState, useRef } from "react";
import CustomDatePicker from "common/CutomDatePicker";
import dayjs from "dayjs";
import { currencyFormat } from "helpers/currency";
import { PencilSimple } from "phosphor-react";

import ClientSelection from "../Generate/ClientSelection";

const InvoiceDetails = ({
  currency,
  clientList,
  selectedClient, setSelectedClient,
  amount,
  dueDate, setDueDate,
  issueDate, setIssueDate,
  invoiceNumber, setInvoiceNumber,
  reference
}) => {

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDateOfIssuePicker, setShowDateOfIssuePicker] = useState<boolean>(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState<boolean>(false);
  const getIssuedDate = dayjs(issueDate).format("DD.MM.YYYY");
  const getDueDate = dayjs(dueDate).format("DD.MM.YYYY");

  const handleDatePickerChange = (date) => {
    setIssueDate(date);
    setShowDateOfIssuePicker(false);
    const newDueDate = new Date(date);
    setDueDate(new Date(newDueDate.setMonth(newDueDate.getMonth() + 1)));
  };

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <ClientSelection
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientList={clientList}
        optionSelected={true}
        clientVisible={true}
      />
      <div className="group">
        <div className="hoverPencil">
          <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
            <span>Date of Issue</span>
            <button className="ml-2 invisible" onClick={() => setShowDateOfIssuePicker(!showDateOfIssuePicker)}>
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          </p>
          {showDateOfIssuePicker && <CustomDatePicker handleChange={handleDatePickerChange} />}
          <p className="font-normal text-base text-miru-dark-purple-1000">
            {getIssuedDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;

