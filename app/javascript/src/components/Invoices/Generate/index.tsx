import React, { Fragment, useEffect, useState } from "react";

import dayjs from "dayjs";
import Logger from "js-logger";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toastr } from "StyledComponents";

import companiesApi from "apis/companies";
import invoicesApi from "apis/invoices";
import PaymentsProviders from "apis/payments/providers";
import { useUserContext } from "context/UserContext";
import { mapGenerateInvoice, unmapGenerateInvoice } from "mapper/mappedIndex";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import InvoiceSettings from "./InvoiceSettings";
import MobileView from "./MobileView";

import Header from "../common/InvoiceForm/Header";
import SendInvoice from "../common/InvoiceForm/SendInvoice";
import { generateInvoiceLineItems } from "../common/utils";
import ConnectPaymentGateway from "../popups/ConnectPaymentGateway";

const GenerateInvoices = () => {
  const navigate = useNavigate();
  const [invoiceDetails, setInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>();
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [reference, setReference] = useState<string>("");
  const [amount, setAmount] = useState<any>(0);
  const [amountDue, setAmountDue] = useState<any>(0);
  const [discount, setDiscount] = useState<any>(0);
  const [tax, setTax] = useState<any>(0);
  const [issueDate, setIssueDate] = useState(dayjs());
  const today = dayjs();
  const [searchParams] = useSearchParams();
  const [dueDate, setDueDate] = useState(dayjs(today).add(1, "month"));
  const [selectedOption, setSelectedOption] = useState<any>([]);
  const [showSendInvoiceModal, setShowSendInvoiceModal] =
    useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<number>(null);
  const [showInvoiceSetting, setShowInvoiceSetting] = useState<boolean>(false);
  const [manualEntryArr, setManualEntryArr] = useState<any>([]);
  const [showConnectPaymentDialog, setShowConnectPaymentDialog] =
    useState<boolean>(false);
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(null);

  const amountPaid = 0;
  const clientId = searchParams.get("clientId");

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR =
    "Please select client and enter invoice number to proceed";

  const { isDesktop } = useUserContext();

  const fetchCompanyDetails = async () => {
    // here we are fetching the company and client list
    try {
      const res = await companiesApi.index();
      const sanitzed = await unmapGenerateInvoice(res.data);
      setInvoiceDetails(sanitzed);
    } catch {
      navigate("invoices/error");
    }
  };

  const fetchPaymentsProvidersSettings = async () => {
    try {
      const res = await PaymentsProviders.get();
      const paymentsProviders = res.data.paymentsProviders;
      const stripe = paymentsProviders.find(p => p.name === "stripe");
      setIsStripeConnected(!!stripe && stripe.enabled);
    } catch {
      Logger.log("ERROR!");
    }
  };

  const setClientListIfClientIdPresent = () => {
    const client = invoiceDetails?.clientList?.find(
      client => client.value === parseInt(clientId)
    );
    if (client) setSelectedClient(client);
  };

  useEffect(() => {
    sendGAPageView();
    fetchCompanyDetails();
    fetchPaymentsProvidersSettings();
  }, []);

  useEffect(() => {
    if (clientId) setClientListIfClientIdPresent();
  }, [invoiceDetails]);

  const saveInvoice = async () => {
    const sanitized = mapGenerateInvoice({
      selectedClient,
      invoiceNumber,
      reference,
      issueDate,
      dueDate,
      invoiceLineItems: generateInvoiceLineItems(
        selectedOption,
        manualEntryArr,
        invoiceDetails.companyDetails.date_format
      ),
      amount,
      amountDue,
      amountPaid,
      discount,
      tax,
      dateFormat: invoiceDetails.companyDetails.date_format,
      setShowSendInvoiceModal,
    });

    return await invoicesApi.post(sanitized);
  };

  const handleSendInvoice = () => {
    if (selectedClient && invoiceNumber !== "") {
      setShowSendInvoiceModal(true);
    } else {
      selectedClient
        ? Toastr.error(INVOICE_NUMBER_ERROR)
        : Toastr.error(SELECT_CLIENT_ERROR);
    }
  };

  const handleSaveSendInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      const res = await saveInvoice();
      setInvoiceId(res?.data.id);

      return res;
    }

    if (selectedClient) {
      return Toastr.error(INVOICE_NUMBER_ERROR);
    }

    return Toastr.error(SELECT_CLIENT_ERROR);
  };

  const handleSaveInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      await saveInvoice();
      navigate("/invoices");
    } else {
      selectedClient
        ? Toastr.error(INVOICE_NUMBER_ERROR)
        : Toastr.error(SELECT_CLIENT_ERROR);
    }
  };
  if (invoiceDetails && isDesktop) {
    return (
      <Fragment>
        <Header
          handleSaveInvoice={handleSaveInvoice}
          handleSendInvoice={handleSendInvoice}
          isStripeEnabled={isStripeConnected}
          setShowConnectPaymentDialog={setShowConnectPaymentDialog}
          setShowInvoiceSetting={setShowInvoiceSetting}
        />
        <Container
          amount={amount}
          amountDue={amountDue}
          amountPaid={amountPaid}
          dateFormat={invoiceDetails.companyDetails.date_format}
          discount={discount}
          dueDate={dueDate}
          invoiceDetails={invoiceDetails}
          invoiceNumber={invoiceNumber}
          issueDate={issueDate}
          lineItems={lineItems}
          manualEntryArr={manualEntryArr}
          reference={reference}
          selectedClient={selectedClient}
          selectedOption={selectedOption}
          setAmount={setAmount}
          setAmountDue={setAmountDue}
          setDiscount={setDiscount}
          setDueDate={setDueDate}
          setInvoiceNumber={setInvoiceNumber}
          setIssueDate={setIssueDate}
          setLineItems={setLineItems}
          setManualEntryArr={setManualEntryArr}
          setReference={setReference}
          setSelectedClient={setSelectedClient}
          setSelectedOption={setSelectedOption}
          setTax={setTax}
          tax={tax}
        />
        {!isStripeConnected && showConnectPaymentDialog && (
          <ConnectPaymentGateway
            invoice={invoiceDetails}
            setIsSending={setShowSendInvoiceModal}
            setShowConnectPaymentDialog={setShowConnectPaymentDialog}
            showConnectPaymentDialog={showConnectPaymentDialog}
          />
        )}
        {showSendInvoiceModal && (
          <SendInvoice
            handleSaveSendInvoice={handleSaveSendInvoice}
            isSending={showSendInvoiceModal}
            setIsSending={setShowSendInvoiceModal}
            invoice={{
              id: invoiceId,
              client: selectedClient,
              company: invoiceDetails?.companyDetails,
              dueDate,
              invoiceNumber,
              amount,
            }}
          />
        )}
        {showInvoiceSetting && (
          <InvoiceSettings setShowInvoiceSetting={setShowInvoiceSetting} />
        )}
      </Fragment>
    );
  }

  if (invoiceDetails && !isDesktop) {
    return (
      <MobileView
        amount={amount}
        amountDue={amountDue}
        amountPaid={amountPaid}
        dateFormat={invoiceDetails.companyDetails.date_format}
        discount={discount}
        dueDate={dueDate}
        handleSaveInvoice={handleSaveInvoice}
        invoiceDetails={invoiceDetails}
        invoiceNumber={invoiceNumber}
        isEdit={false}
        isStripeEnabled={isStripeConnected}
        issueDate={issueDate}
        lineItems={lineItems}
        manualEntryArr={manualEntryArr}
        reference={reference}
        selectedClient={selectedClient}
        selectedLineItems={selectedOption}
        setAmount={setAmount}
        setAmountDue={setAmountDue}
        setDiscount={setDiscount}
        setDueDate={setDueDate}
        setInvoiceNumber={setInvoiceNumber}
        setIssueDate={setIssueDate}
        setLineItems={setLineItems}
        setManualEntryArr={setManualEntryArr}
        setReference={setReference}
        setSelectedClient={setSelectedClient}
        setSelectedLineItems={setSelectedOption}
        setShowConnectPaymentDialog={setShowConnectPaymentDialog}
        setTax={setTax}
        showConnectPaymentDialog={showConnectPaymentDialog}
        tax={tax}
      />
    );
  }

  return <div />;
};

export default GenerateInvoices;
