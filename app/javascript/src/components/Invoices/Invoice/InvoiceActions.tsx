import React from "react";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import SendButton from "./SendButton";

const InvoiceActions = ({ deleteInvoice, editInvoiceLink, sendInvoice }) => (
  <>
    <div className="flex flex-row justify-items-right">
      <DeleteButton onClick={deleteInvoice}/>
      <EditButton editInvoiceLink={editInvoiceLink} />
      <SendButton onClick={sendInvoice}/>
    </div>
  </>
);

export default InvoiceActions;
