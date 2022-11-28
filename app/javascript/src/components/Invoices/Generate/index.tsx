import React, { Fragment, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import companiesApi from "apis/companies";
import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";
import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import InvoiceSettings from "./InvoiceSettings";

import {
  mapGenerateInvoice,
  unmapGenerateInvoice,
} from "../../../mapper/generateInvoice.mapper";
import Header from "../common/InvoiceForm/Header";
import SendInvoice from "../common/InvoiceForm/SendInvoice";
import { generateInvoiceLineItems } from "../common/utils";

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
  const [issueDate, setIssueDate] = useState(new Date());
  const today = new Date();
  const [dueDate, setDueDate] = useState(
    today.setMonth(issueDate.getMonth() + 1)
  );
  const [selectedOption, setSelectedOption] = useState<any>([]);
  const [showSendInvoiceModal, setShowSendInvoiceModal] =
    useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<number>(null);
  const [showInvoiceSetting, setShowInvoiceSetting] = useState<boolean>(false);
  const [manualEntryArr, setManualEntryArr] = useState<any>([]);

  const amountPaid = 0;

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR =
    "Please select client and enter invoice number to proceed";

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

  useEffect(() => {
    sendGAPageView();
    fetchCompanyDetails();
  }, []);

  const saveInvoice = async () => {
    const sanitized = mapGenerateInvoice({
      selectedClient,
      invoiceNumber,
      reference,
      issueDate,
      dueDate,
      invoiceLineItems: generateInvoiceLineItems(
        selectedOption,
        manualEntryArr
      ),
      amount,
      amountDue,
      amountPaid,
      discount,
      tax,
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

    selectedClient
      ? Toastr.error(INVOICE_NUMBER_ERROR)
      : Toastr.error(SELECT_CLIENT_ERROR);
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

  if (invoiceDetails) {
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

  return <div />;
};

export default GenerateInvoices;
