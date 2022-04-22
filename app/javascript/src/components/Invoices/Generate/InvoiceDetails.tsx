import React, { useState, useRef } from "react";
import { PencilSimple } from "phosphor-react";
import ClientSelection from "./ClientSelection";
import useOutsideClick from "../../../helpers/outsideClick";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const  InvoiceDetails = ({
  clientList,
  selectedClient, setSelectedClient,
  amountDue,
  issueDate, setIssueDate,
  dueDate,
  invoiceNumber,
  setInvoiceNumber,
  reference
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setIsEditing(false), isEditing);
  const getIssuedDate = dayjs(issueDate).format("DD.MM.YYYY")
  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <ClientSelection selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientList ={clientList} />
      <div className="group">
        <div className="hoverPencil">
          <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
            Date of Issue
            <DatePicker onChange={(date:Date) => setIssueDate(date)} customInput={<button className="ml-2 invisible">
              <PencilSimple size={13} color="#1D1A31" />
            </button>} />
          </p>

          <p className="font-normal text-base text-miru-dark-purple-1000">
            {getIssuedDate}
          </p>
        </div>
        <div  className="hoverPencil">
          <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
            Due Date
            <button className="ml-2 invisible">
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          </p>
          <p className="font-normal text-base text-miru-dark-purple-1000">
            {dueDate}
          </p>
        </div>
      </div>

      <div>
        <div className="flex flex-col" ref={wrapperRef}>
          <div className="flex flex-row">
            <p className="font-normal text-xs text-miru-dark-purple-1000">
              Invoice Number
            </p>
            <button onClick={() => { setIsEditing(!isEditing); }}>
              <PencilSimple size={13} color="#1D1A31" />
            </button>
          </div>
          <input type="text" disabled={!isEditing} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value) }/>
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
          ${amountDue}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
