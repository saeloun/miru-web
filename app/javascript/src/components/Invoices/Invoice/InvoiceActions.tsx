import React from "react";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import SendButton from "./SendButton";

const InvoiceActions = ({ deleteInvoice, editInvoice, sendInvoice }) => (
  <>
    <div className="flex flex-row justify-items-right">
      <DeleteButton onClick={deleteInvoice}/>
      <EditButton onClick={editInvoice}/>
      <SendButton onClick={sendInvoice}/>
    </div>
  </>
);

export default InvoiceActions;
