import React, { useEffect, useState } from "react";

import { ApiStatus as InvoiceStatus } from "constants/index";

import { useParams } from "react-router-dom";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

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

  const handleDownloadInvoice = async () => {
    try {
      const response = await invoicesApi.downloadInvoice(invoice.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch {
      Toastr.error("Something went wrong");
    }
  };

  useEffect(() => {
    sendGAPageView();
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
          setInvoiceToDelete={setInvoiceToDelete} handleDownloadInvoice={handleDownloadInvoice}/>
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          <InvoiceDetails invoice={invoice} />
        </div>
        {
          showSendInvoiceModal &&
          <SendInvoice invoice={invoice} setIsSending={setShowInvoiceModal} isSending={showSendInvoiceModal} />
        }
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
