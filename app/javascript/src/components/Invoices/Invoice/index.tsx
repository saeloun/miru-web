import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import invoicesApi from "apis/invoices";
import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";
import { ApiStatus as InvoiceStatus } from "../../../constants";
import DeleteInvoice from "../popups/DeleteInvoice";
import SendInvoice from "../popups/SendInvoice";

const Invoice = () => {
  const params = useParams();

  const [status, setStatus] = React.useState<InvoiceStatus>(
    InvoiceStatus.IDLE
  );
  const [invoice, setInvoice] = useState<any>(null);
  const [showSendInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);
  const fetchInvoice = async () => {
    try {
      setStatus(InvoiceStatus.LOADING);
      const res = await invoicesApi.getInvoice(params.id);
      setInvoice(res.data);
      setStatus(InvoiceStatus.SUCCESS);
    } catch (err) {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchInvoice();
  }, []);

  const handleSendInvoice = () => {
    setShowInvoiceModal(true);
  };

  return (
    status === InvoiceStatus.SUCCESS && (
      <>
        <Header invoice={invoice} handleSendInvoice={handleSendInvoice} setShowDeleteDialog={setShowDeleteDialog}
          setInvoiceToDelete={setInvoiceToDelete} />
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          <InvoiceDetails invoice={invoice} />
        </div>
        {showSendInvoiceModal && <SendInvoice invoice={invoice} setIsSending={setShowInvoiceModal} isSending={showSendInvoiceModal} />}
        {showDeleteDialog && (
          <DeleteInvoice
            invoice={invoiceToDelete}
            setShowDeleteDialog={setShowDeleteDialog}
          />
        )}
      </>
    )
  );
};

export default Invoice;
