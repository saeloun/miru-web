import React, { useState, useRef } from "react";
import { PencilSimple } from "phosphor-react";
import ClientSelection from "./ClientSelection";
import useOutsideClick from "../../../helpers/outsideClick";

const InvoiceDetails = ({
  clientList,
  selectedClient, setSelectedClient,
  amount,
  issueDate,
  dueDate,
  invoiceNumber,
  setInvoiceNumber,
  reference
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setIsEditing(false), isEditing);

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <ClientSelection selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientList ={clientList} />
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Date of Issue
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {issueDate}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
          Due Date
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {dueDate}
        </p>
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
          ${amount}
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
