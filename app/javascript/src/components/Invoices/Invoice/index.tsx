import React, { useEffect, useState } from "react";

import { ArrowLeftIcon } from "miruIcons";
import { useParams } from "react-router-dom";
import { Button } from "StyledComponents";

import invoicesApi from "apis/invoices";
import { ApiStatus as InvoiceStatus } from "constants/index";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";
import MobileView from "./MobileView";

import SendInvoiceContainer from "../Generate/MobileView/Container/SendInvoiceContainer";
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
    ) : showSendInvoiceModal ? (
      <div className="flex h-full flex-col">
        <div className="flex w-full bg-miru-han-purple-1000 pl-4">
          <Button
            style="ternary"
            onClick={() => setShowSendInvoiceModal(false)}
          >
            <ArrowLeftIcon className="text-white" size={16} weight="bold" />
          </Button>
          <div className="flex h-12 w-full items-center justify-center bg-miru-han-purple-1000 px-3 text-white">
            Send Invoice
          </div>
        </div>
        <div className="flex flex-1">
          <SendInvoiceContainer
            handleSaveSendInvoice={null}
            invoice={invoice}
          />
        </div>
      </div>
    ) : (
      <MobileView handleSendInvoice={handleSendInvoice} invoice={invoice} />
    ))
  );
};

export default Invoice;
