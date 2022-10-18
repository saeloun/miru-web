import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import companiesApi from "apis/companies";
import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";
// import { sendGAPageView } from "utils/googleAnalytics";

import Container from "./Container";
import InvoiceSettings from "./InvoiceSettings";

import { mapGenerateInvoice, unmapGenerateInvoice } from "../../../mapper/generateInvoice.mapper";
import Header from "../common/InvoiceForm/Header";
import { generateInvoiceLineItems } from "../common/utils";
import SendInvoice from "../popups/SendInvoice";

const GenerateInvoices = () => {
  const navigate = useNavigate();
  const [invoiceDetails, setInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>();
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [reference] = useState<any>("");
  const [amount, setAmount] = useState<any>(0);
  const [amountDue, setAmountDue] = useState<any>(0);
  const [amountPaid] = useState<any>(0);
  const [discount, setDiscount] = useState<any>(0);
  const [tax, setTax] = useState<any>(0);
  const [issueDate, setIssueDate] = useState(new Date());
  const today = new Date();
  const [dueDate, setDueDate] = useState(today.setMonth(issueDate.getMonth() + 1));
  const [selectedOption, setSelectedOption] = useState<any>([]);
  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<number>(null);
  const [showInvoiceSetting, setShowInvoiceSetting] = useState<boolean>(true);
  const [manualEntryArr, setManualEntryArr] = useState<any>([]);

  const fetchCompanyDetails = async () => {
    // here we are fetching the company and client list
    try {
      const res = await companiesApi.index();
      const sanitzed = await unmapGenerateInvoice(res.data);
      setInvoiceDetails(sanitzed);
    } catch (e) {
      navigate("invoices/error");
      return {};
    }
  };

  useEffect(() => {
    // sendGAPageView();
    setAuthHeaders();
    registerIntercepts();
    fetchCompanyDetails();
  }, []);

  const saveInvoice = async () => {
    const sanitized = mapGenerateInvoice({
      selectedClient,
      invoiceNumber,
      reference,
      issueDate,
      dueDate,
      invoiceLineItems: generateInvoiceLineItems(selectedOption, manualEntryArr),
      amount,
      amountDue,
      amountPaid,
      discount,
      tax,
      setShowSendInvoiceModal
    });
    return await invoicesApi.post(sanitized);
  };

  const handleSendInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      saveInvoice().then((resp) => {
        setShowSendInvoiceModal(true);
        setInvoiceId(resp.data.id);
      });
    } else {
      selectedClient
        ? Toastr.error("Please enter invoice number to proceed")
        : Toastr.error("Please select client and enter invoice number to proceed");
    }
  };

  const handleSaveInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      saveInvoice().then(() => navigate("/invoices"));
    } else {
      selectedClient
        ? Toastr.error("Please enter invoice number to proceed")
        : Toastr.error("Please select client and enter invoice number to proceed");
    }
  };

  if (invoiceDetails) {
    return (
      <React.Fragment>
        <Header
          handleSaveInvoice={handleSaveInvoice}
          handleSendInvoice={handleSendInvoice}
          setShowInvoiceSetting={setShowInvoiceSetting}
        />
        <Container
          invoiceDetails={invoiceDetails}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          lineItems={lineItems}
          setLineItems={setLineItems}
          invoiceNumber={invoiceNumber}
          setInvoiceNumber={setInvoiceNumber}
          reference={reference}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
          amount={amount}
          setAmount={setAmount}
          amountDue={amountDue}
          setAmountDue={setAmountDue}
          amountPaid={amountPaid}
          discount={discount}
          setDiscount={setDiscount}
          tax={tax}
          setTax={setTax}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          manualEntryArr={manualEntryArr}
          setManualEntryArr={setManualEntryArr}
        />

        {showSendInvoiceModal && <SendInvoice invoice={{
          id: invoiceId,
          client: selectedClient,
          company: invoiceDetails?.companyDetails,
          dueDate: dueDate,
          invoiceNumber,
          amount
        }}
        isSending={showSendInvoiceModal}
        setIsSending={setShowSendInvoiceModal}
        />}

        {showInvoiceSetting && (
          <InvoiceSettings
            setShowInvoiceSetting={setShowInvoiceSetting}
          />
        )}
      </React.Fragment>
    );
  }
  return <></>;
};

export default GenerateInvoices;
