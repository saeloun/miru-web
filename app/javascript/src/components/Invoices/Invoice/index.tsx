import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import invoicesApi from "apis/invoices";
import { ApiStatus as InvoiceStatus } from "constants/index";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";
import MobileView from "./MobileView";

import DeleteInvoice from "../popups/DeleteInvoice";
import SendInvoice from "../popups/SendInvoice";

const Invoice = () => {
  const params = useParams();

  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [invoice, setInvoice] = useState<any>(null);
  const [showSendInvoiceModal, setShowSendInvoiceModal] =
    useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const { isDesktop } = useUserContext();
  const fetchInvoice = async () => {
    try {
      setStatus(InvoiceStatus.LOADING);
      const res = await invoicesApi.getInvoice(params.id);
      setInvoice(res.data);
      setStatus(InvoiceStatus.SUCCESS);
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchInvoice();
  }, []);

  const handleSendInvoice = () => {
    setShowSendInvoiceModal(true);
  };

  return (
    status === InvoiceStatus.SUCCESS &&
    (isDesktop ? (
      <>
        <Header
          handleSendInvoice={handleSendInvoice}
          invoice={invoice}
          setInvoiceToDelete={setInvoiceToDelete}
          setShowDeleteDialog={setShowDeleteDialog}
        />
        <div className="m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
          <InvoiceDetails invoice={invoice} />
        </div>
        {showSendInvoiceModal && (
          <SendInvoice
            invoice={invoice}
            isSending={showSendInvoiceModal}
            setIsSending={setShowSendInvoiceModal}
          />
        )}
        {showDeleteDialog && (
          <DeleteInvoice
            invoice={invoiceToDelete}
            setShowDeleteDialog={setShowDeleteDialog}
          />
        )}
      </>
    ) : (
      <MobileView invoice={invoice} />
    ))
  );
};

export default Invoice;
