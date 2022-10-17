import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import clientsApi from "apis/clients";
import invoicesApi from "apis/invoices";
import Toastr from "common/Toastr";
import { sendGAPageView } from "utils/googleAnalytics";

import { unmapLineItems } from "../../../mapper/editInvoice.mapper";
import CompanyInfo from "../common/CompanyInfo";
import InvoiceDetails from "../common/InvoiceDetails";
import Header from "../common/InvoiceForm/Header";
import SendInvoice from "../common/InvoiceForm/SendInvoice";
import InvoiceTable from "../common/InvoiceTable";
import InvoiceTotal from "../common/InvoiceTotal";
import { generateInvoiceLineItems } from "../common/utils";

const EditInvoice = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [invoiceDetails, setInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [manualEntryArr, setManualEntryArr] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>({ value: 0 });
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [reference] = useState<any>("");
  const [amount, setAmount] = useState<any>(0);
  const [amountDue, setAmountDue] = useState<any>(0);
  const [amountPaid, setAmountPaid] = useState<any>(0);
  const [discount, setDiscount] = useState<any>(0);
  const [tax, setTax] = useState<any>(0);
  const [issueDate, setIssueDate] = useState<any>();
  const [dueDate, setDueDate] = useState<any>();
  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState<boolean>(false);

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR = "Please select client and enter invoice number to proceed";

  const fetchInvoice = async () => {
    try {
      const res = await invoicesApi.editInvoice(params.id);
      setInvoiceDetails(res.data);
      setIssueDate(Date.parse(res.data.issueDate));
      setDueDate(Date.parse(res.data.dueDate));
      setSelectedLineItems(unmapLineItems(res.data.invoiceLineItems));
      setAmount(res.data.amount);
      setInvoiceNumber(res.data.invoiceNumber);
      setDiscount(res.data.discount);
      setSelectedClient(res.data.client);
      setAmountDue(res.data.amountDue);
      setAmountPaid(res.data.amountPaid);
    } catch (e) {
      navigate("/invoices/error");
      return {};
    }
  };

  const fetchNewLineItems = async (navigate, id, setSelectedClient, setLineItems) => {
    try {
      const res = await clientsApi.newInvoiceLineItems(id);
      const { address, phone, email, id: value, name: label } = res.data.client;

      setSelectedClient({ address, email, label, phone, value });
      setLineItems([]);
    } catch (e) {
      navigate("/invoices/error");
      return {};
    }
  };

  useEffect(() => {
    sendGAPageView();
    setAuthHeaders();
    registerIntercepts();
    fetchInvoice();
  }, []);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    if (selectedClient.value != 0) {
      fetchNewLineItems(navigate, selectedClient.value, setSelectedClient, setLineItems);
    }
  }, [selectedClient.value]);

  const updateInvoice = async () => {
    try {
      const res = await invoicesApi.updateInvoice(invoiceDetails.id, {
        invoice_number: invoiceNumber || invoiceDetails.invoiceNumber,
        issue_date: dayjs(issueDate || invoiceDetails.issueDate).format("DD.MM.YYYY"),
        due_date: dayjs(dueDate || invoiceDetails.dueDate).format("DD.MM.YYYY"),
        amount_due: amountDue,
        amount_paid: amountPaid,
        amount: amount,
        discount: Number(discount),
        tax: tax || invoiceDetails.tax,
        client_id: selectedClient.value,
        invoice_line_items_attributes: generateInvoiceLineItems(selectedLineItems, manualEntryArr)
      });
      return res;
    } catch (e) {
      navigate(`/invoices/${invoiceDetails.id}`);
      return {};
    }
  };

  const handleSaveInvoice = () => {
    if (selectedClient && invoiceNumber !== "") {
      updateInvoice().then(() => navigate(`/invoices/${invoiceDetails.id}`));
    } else {
      selectedClient
        ? Toastr.error(INVOICE_NUMBER_ERROR)
        : Toastr.error(SELECT_CLIENT_ERROR);
    }
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
      const res = await updateInvoice();
      return res;
    } else {
      selectedClient
        ? Toastr.error(INVOICE_NUMBER_ERROR)
        : Toastr.error(SELECT_CLIENT_ERROR);
    }
  };

  if (invoiceDetails) {
    return (
      <React.Fragment>
        <Header
          formType = "edit"
          handleSaveInvoice={handleSaveInvoice}
          handleSendInvoice={handleSendInvoice}
          setShowInvoiceSetting={false}
          invoiceNumber={invoiceDetails.invoiceNumber}
          id={invoiceDetails.id}
        />
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          <CompanyInfo company={invoiceDetails.company} />
          <InvoiceDetails
            currency={invoiceDetails.company.currency}
            clientList={invoiceDetails.companyClientList}
            amount={amount}
            selectedClient={selectedClient || invoiceDetails.client}
            setSelectedClient={setSelectedClient}
            issueDate={issueDate || invoiceDetails.issueDate}
            setIssueDate={setIssueDate}
            dueDate={dueDate || invoiceDetails.dueDate}
            setDueDate={setDueDate}
            invoiceNumber={invoiceNumber}
            setInvoiceNumber={setInvoiceNumber}
            reference={reference}
            optionSelected={true}
            clientVisible={false}
          />
          <div className="pl-10 py-5">
            <InvoiceTable
              currency={invoiceDetails.company.currency}
              selectedClient={selectedClient || invoiceDetails.client}
              lineItems={lineItems}
              setLineItems={setLineItems}
              selectedLineItems={selectedLineItems}
              setSelectedLineItems={setSelectedLineItems}
              manualEntryArr={manualEntryArr}
              setManualEntryArr={setManualEntryArr}
            />
          </div>
          <InvoiceTotal
            currency={invoiceDetails.company.currency}
            newLineItems={selectedLineItems}
            amountPaid={amountPaid}
            amountDue={amountDue}
            setAmountDue={setAmountDue}
            setAmount={setAmount}
            discount={discount}
            setDiscount={setDiscount}
            tax={tax || invoiceDetails.tax}
            setTax={setTax}
            showDiscountInput={!!invoiceDetails.discount}
            showTax={!!invoiceDetails.tax}
            manualEntryArr={manualEntryArr}
          />
        </div>
        {showSendInvoiceModal &&
          <SendInvoice  invoice={{
            id: invoiceDetails.id,
            client: selectedClient,
            company: invoiceDetails?.company,
            dueDate: dueDate,
            invoiceNumber,
            amount
          }}
          isSending={showSendInvoiceModal}
          setIsSending={setShowSendInvoiceModal}
          handleSaveSendInvoice={handleSaveSendInvoice}
          />}
      </React.Fragment>
    );
  }
  return <></>;
};

export default EditInvoice;
