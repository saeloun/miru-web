import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import generateInvoice from "apis/generateInvoice";

import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";
import Container from "./Container";
import Header from "./Header";

import Invoice_settings from "./Invoice_settings";
import { mapGenerateInvoice, unmapGenerateInvoice } from "../../../mapper/generateInvoice.mapper";
import SendInvoice from "../popups/SendInvoice";

const fetchGenerateInvoice = async (navigate, getInvoiceDetails) => {
  try {
    const res = await generateInvoice.get();
    const sanitzed = await unmapGenerateInvoice(res.data);
    getInvoiceDetails(sanitzed);

  } catch (e) {
    navigate("invoices/error");
    return {};
  }
};

const GenerateInvoices = () => {
  const navigate = useNavigate();
  const [invoiceDetails, getInvoiceDetails] = useState<any>();
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

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchGenerateInvoice(navigate, getInvoiceDetails);
  }, []);

  const saveInvoice = async () => {
    const sanitized = mapGenerateInvoice({
      selectedClient,
      invoiceNumber,
      reference,
      issueDate,
      dueDate,
      selectedOption,
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
      saveInvoice().then(resp => {
        setShowSendInvoiceModal(true);
        setInvoiceId(resp.data.id);
      });
    }
    else {
      Toastr.error("Please select client and enter invoice number to proceed.");
    }
  };

  const handleSaveInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      saveInvoice().then(() => navigate("/invoices"));
    } else {
      Toastr.error("Please select client and enter invoice number to proceed.");
    }
  };

  if (invoiceDetails) {
    return (
      <React.Fragment>
        <Header
          handleSendInvoice={handleSendInvoice}
          handleSaveInvoice={handleSaveInvoice}
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
        />

        {showSendInvoiceModal && <SendInvoice invoice={{
          id: invoiceId,
          client: selectedClient,
          company: invoiceDetails?.companyDetails,
          invoiceNumber,
          amount
        }}
        isSending={showSendInvoiceModal}
        setIsSending={setShowSendInvoiceModal}
        />}

        {showInvoiceSetting && (
          <Invoice_settings
            setShowInvoiceSetting={setShowInvoiceSetting}
          />
        )}
      </React.Fragment>
    );
  }
  return <></>;
};

export default GenerateInvoices;
