import React, { Fragment, useCallback, useEffect, useState } from "react";

import dayjs from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toastr } from "StyledComponents";

import companiesApi from "apis/companies";
import invoicesApi from "apis/invoices";
import PaymentsProviders from "apis/payments/providers";
import Loader from "common/Loader/index";
import { ApiStatus as InvoiceStatus } from "constants/index";
import { useUserContext } from "context/UserContext";
import { mapGenerateInvoice, unmapGenerateInvoice } from "mapper/mappedIndex";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import MobileView from "./MobileView";

import Header from "../common/InvoiceForm/Header";
import SendInvoice from "../common/InvoiceForm/SendInvoice";
import { generateInvoiceLineItems } from "../common/utils";
import InvoiceSettings from "../InvoiceSettings";
import ConnectPaymentGateway from "../popups/ConnectPaymentGateway";

const GenerateInvoices = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [invoiceDetails, setInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedClient, setSelectedClient] = useState<any>();
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [clientCurrency, setClientCurrency] = useState<string>("USD");
  const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<any>(0);
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
  const [isStripeEnabled, setIsStripeEnabled] = useState<boolean>(true);

  const amountPaid = 0;
  const clientId = searchParams.get("clientId");

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR =
    "Please select client and enter invoice number to proceed";

  const { isDesktop } = useUserContext();

  const fetchCompanyDetails = useCallback(async () => {
    // here we are fetching the company and client list
    try {
      setIsLoading(true);
      const res = await companiesApi.index();
      const sanitized = await unmapGenerateInvoice(res.data);
      setInvoiceDetails(sanitized);
      setIsLoading(false);
    } catch {
      navigate("invoices/error");
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchPaymentsProvidersSettings = async () => {
    try {
      const res = await PaymentsProviders.get();
      const paymentsProviders = res.data.paymentsProviders;
      const stripe = paymentsProviders.find(p => p.name === "stripe");
      setIsStripeConnected(!!stripe && stripe.enabled);
    } catch {
      Toastr.error("ERROR! CONNECTING TO PAYMENTS");
    }
  };

  const setClientListIfClientIdPresent = useCallback(() => {
    const client = invoiceDetails?.clientList?.find(
      client => client.value === parseInt(clientId)
    );
    if (client) setSelectedClient(client);
  }, [invoiceDetails?.clientList, clientId]);

  useEffect(() => {
    sendGAPageView();
    fetchCompanyDetails();
    fetchPaymentsProvidersSettings();
  }, [fetchCompanyDetails]);

  useEffect(() => {
    if (clientId) setClientListIfClientIdPresent();
  }, [clientId, invoiceDetails, setClientListIfClientIdPresent]);

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
      baseCurrencyAmount,
      tax,
      dateFormat: invoiceDetails.companyDetails.date_format,
      setShowSendInvoiceModal,
      isStripeEnabled,
    });

    return await invoicesApi.post(sanitized);
  };

  const handleSendInvoice = () => {
    if (selectedClient && invoiceNumber !== "") {
      isStripeConnected
        ? setShowSendInvoiceModal(true)
        : setShowConnectPaymentDialog(true);
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
      // Update baseCurrencyAmount from backend response
      if (
        res?.data?.baseCurrencyAmount !== undefined &&
        res?.data?.baseCurrencyAmount !== null
      ) {
        setBaseCurrencyAmount(res.data.baseCurrencyAmount);
      }

      return res;
    }

    if (selectedClient) {
      return Toastr.error(INVOICE_NUMBER_ERROR);
    }

    return Toastr.error(SELECT_CLIENT_ERROR);
  };

  const handleSaveInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      const res = await saveInvoice();
      // Update baseCurrencyAmount from backend response
      if (
        res?.data?.baseCurrencyAmount !== undefined &&
        res?.data?.baseCurrencyAmount !== null
      ) {
        setBaseCurrencyAmount(res.data.baseCurrencyAmount);
      }
      navigate("/invoices");
    } else {
      selectedClient
        ? Toastr.error(INVOICE_NUMBER_ERROR)
        : Toastr.error(SELECT_CLIENT_ERROR);
    }
  };

  const submitSaveSendInvoice = async (e, invoiceEmail) => {
    e.preventDefault();
    try {
      setStatus(InvoiceStatus.LOADING);
      const res = await handleSaveSendInvoice();
      if (res.status === 200) {
        submitSendInvoice(res.data.id, invoiceEmail);
      } else {
        Toastr.error("Send invoice failed");
        setStatus(InvoiceStatus.ERROR);
      }
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  const submitSendInvoice = async (invoiceId, invoiceEmail) => {
    try {
      const payload = { invoice_email: invoiceEmail };
      const resp = await invoicesApi.sendInvoice(invoiceId, payload);
      Toastr.success(resp.data.message);
      setStatus(InvoiceStatus.SUCCESS);
    } catch {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (invoiceDetails && isDesktop) {
    return (
      <Fragment>
        <Header
          handleSaveInvoice={handleSaveInvoice}
          handleSendInvoice={handleSendInvoice}
          setShowInvoiceSetting={setShowInvoiceSetting}
        />
        <Container
          amount={amount}
          amountDue={amountDue}
          amountPaid={amountPaid}
          baseCurrencyAmount={baseCurrencyAmount}
          clientCurrency={clientCurrency}
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
          setBaseCurrencyAmount={setBaseCurrencyAmount}
          setClientCurrency={setClientCurrency}
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
            handleSubmit={submitSaveSendInvoice}
            isSending={showSendInvoiceModal}
            setIsSending={setShowSendInvoiceModal}
            status={status}
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
          <InvoiceSettings
            isStripeEnabled={isStripeEnabled}
            setIsStripeEnabled={setIsStripeEnabled}
            setShowInvoiceSetting={setShowInvoiceSetting}
          />
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
        baseCurrency={invoiceDetails?.companyDetails?.currency}
        baseCurrencyAmount={baseCurrencyAmount}
        clientCurrency={clientCurrency}
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
        setBaseCurrencyAmount={setBaseCurrencyAmount}
        setClientCurrency={setClientCurrency}
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
