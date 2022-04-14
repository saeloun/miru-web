import React, { useState } from "react";
import dayjs from "dayjs";
import ClientSelection from "./ClientSelection";

const InvoiceDetails = ({ clientList, selectedClient, setSelectedClient }) => {
  const [issueDate] = useState<string>(dayjs().format("DD.MM.YYYY"));
  const [dueDate] = useState<string>(dayjs().add(1, "month").format("DD.MM.YYYY"));

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
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          6335 7871
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
          Reference
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          -
        </p>
      </div>

      <div>
        <p className="font-normal text-xs text-miru-dark-purple-1000 text-right">
          Amount
        </p>
        <p className="font-normal text-4xl text-miru-dark-purple-1000 mt-6">
          $90.00
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetails;
