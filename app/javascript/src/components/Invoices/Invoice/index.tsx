import { ApiStatus as InvoiceStatus } from "constants/index";

import React, { useEffect, useState } from "react";

import invoicesApi from "apis/invoices";
import PaymentsProviders from "apis/payments/providers";
import Loader from "common/Loader/index";
import SendInvoice from "components/Invoices/common/InvoiceForm/SendInvoice";
import { useUserContext } from "context/UserContext";
import { ArrowLeftIcon } from "miruIcons";
import { useParams } from "react-router-dom";
import { Button, Toastr } from "StyledComponents";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";
import MobileView from "./MobileView";
import ViewHistory from "./ViewHistory";

import SendInvoiceContainer from "../Generate/MobileView/Container/SendInvoiceContainer";
import ConnectPaymentGateway from "../popups/ConnectPaymentGateway";
import DeleteInvoice from "../popups/DeleteInvoice";
import WavieOffInvoice from "../popups/WavieOffInvoice";

const Invoice = () => {
  const params = useParams();

  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [sendStatus, setSendStatus] = useState<InvoiceStatus>(
    InvoiceStatus.IDLE
  );
  const [invoice, setInvoice] = useState<any>(null);
  const [showSendInvoiceModal, setShowSendInvoiceModal] =
    useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [invoiceToWaive, setInvoiceToWaive] = useState(null);
  const [showWavieDialog, setShowWavieDialog] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [isSendReminder, setIsSendReminder] = useState<boolean>(false);
  const [showConnectPaymentDialog, setShowConnectPaymentDialog] =
    useState<boolean>(false);
  const [isStripeEnabled, setIsStripeEnabled] = useState<boolean>(null);
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
    fetchPaymentsProvidersSettings();
  }, []);

  const handleSendInvoice = () => {
    setShowSendInvoiceModal(true);
  };

  const fetchPaymentsProvidersSettings = async () => {
    try {
      const res = await PaymentsProviders.get();
      const paymentsProviders = res.data.paymentsProviders;
      const stripe = paymentsProviders.find(p => p.name === "stripe");
      setIsStripeEnabled(!!stripe && stripe.enabled);
    } catch {
      Toastr.error("ERROR! CONNECTING TO PAYMENTS");
    }
  };

  const submitSendInvoice = async (e, invoiceEmail) => {
    e.preventDefault();
    if (invoiceEmail?.recipients.length > 0) {
      try {
        setSendStatus(InvoiceStatus.LOADING);

        const payload = { invoice_email: invoiceEmail };
        let resp;
        if (isSendReminder) {
          resp = await invoicesApi.sendReminder(invoice.id, payload);
        } else {
          resp = await invoicesApi.sendInvoice(invoice.id, payload);
        }

        Toastr.success(resp.data.message);
        setSendStatus(InvoiceStatus.SUCCESS);
        setIsSendReminder(false);
      } catch {
        setSendStatus(InvoiceStatus.ERROR);
      }
    }
  };

  if (status === InvoiceStatus.LOADING) {
    return <Loader />;
  }

  return (
    status === InvoiceStatus.SUCCESS &&
    // eslint-disable-next-line no-nested-ternary
    (isDesktop ? (
      <>
        <Header
          fetchInvoice={fetchInvoice}
          handleSendInvoice={handleSendInvoice}
          invoice={invoice}
          isStripeEnabled={isStripeEnabled}
          setInvoiceToDelete={setInvoiceToDelete}
          setInvoiceToWaive={setInvoiceToWaive}
          setIsSendReminder={setIsSendReminder}
          setShowConnectPaymentDialog={setShowConnectPaymentDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          setShowHistory={setShowHistory}
          setShowWavieDialog={setShowWavieDialog}
        />
        <div className="m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
          <InvoiceDetails invoice={invoice} />
        </div>
        {!showConnectPaymentDialog &&
          (showSendInvoiceModal || isSendReminder) && (
            <SendInvoice
              handleSubmit={submitSendInvoice}
              invoice={invoice}
              isSendReminder={isSendReminder}
              isSending={showSendInvoiceModal}
              setIsSendReminder={setIsSendReminder}
              setIsSending={setShowSendInvoiceModal}
              status={sendStatus}
            />
          )}
        {!isStripeEnabled && showConnectPaymentDialog && (
          <ConnectPaymentGateway
            invoice={invoice}
            setIsSending={setShowSendInvoiceModal}
            setShowConnectPaymentDialog={setShowConnectPaymentDialog}
            showConnectPaymentDialog={showConnectPaymentDialog}
          />
        )}
        {showWavieDialog && (
          <WavieOffInvoice
            invoice={invoiceToWaive}
            invoiceNumber={invoice.invoiceNumber}
            setShowWavieDialog={setShowWavieDialog}
            showWavieDialog={showWavieDialog}
          />
        )}
        {showHistory && (
          <ViewHistory invoice={invoice} setShowHistory={setShowHistory} />
        )}
        {showDeleteDialog && (
          <DeleteInvoice
            invoice={invoiceToDelete}
            setShowDeleteDialog={setShowDeleteDialog}
            showDeleteDialog={showDeleteDialog}
          />
        )}
      </>
    ) : showSendInvoiceModal ? (
      <div className="flex h-full flex-col">
        <div className="flex w-full bg-miru-han-purple-1000 pl-4">
          <Button
            style="ternary"
            onClick={() => {
              if (isSendReminder) {
                setShowSendInvoiceModal(false);
                setIsSendReminder(false);
              } else {
                setShowSendInvoiceModal(false);
              }
            }}
          >
            <ArrowLeftIcon className="text-white" size={16} weight="bold" />
          </Button>
          <div className="flex h-12 w-full items-center justify-center bg-miru-han-purple-1000 px-3 text-white">
            {isSendReminder ? "Send Invoice Reminder" : "Send Invoice"}
          </div>
        </div>
        <div className="flex flex-1">
          <SendInvoiceContainer
            handleSaveSendInvoice={null}
            invoice={invoice}
            isSendReminder={isSendReminder}
            setIsSendReminder={setIsSendReminder}
            setIsSending={setShowSendInvoiceModal}
          />
        </div>
      </div>
    ) : (
      <MobileView
        fetchInvoice={fetchInvoice}
        handleSendInvoice={handleSendInvoice}
        invoice={invoice}
        isStripeEnabled={isStripeEnabled}
        setIsSendReminder={setIsSendReminder}
        setShowConnectPaymentDialog={setShowConnectPaymentDialog}
        setShowSendInvoiceModal={setShowSendInvoiceModal}
        showConnectPaymentDialog={showConnectPaymentDialog}
      />
    ))
  );
};

export default Invoice;
