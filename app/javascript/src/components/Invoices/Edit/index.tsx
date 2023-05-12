import React, { Fragment, useEffect, useState } from "react";

import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import { useUserContext } from "context/UserContext";
import { unmapLineItems } from "mapper/mappedIndex";
import { sendGAPageView } from "utils/googleAnalytics";

import EditInvoiceForm from "./Mobile";

import CompanyInfo from "../common/CompanyInfo";
import InvoiceDetails from "../common/InvoiceDetails";
import Header from "../common/InvoiceForm/Header";
import SendInvoice from "../common/InvoiceForm/SendInvoice";
import InvoiceTable from "../common/InvoiceTable";
import InvoiceTotal from "../common/InvoiceTotal";
import { generateInvoiceLineItems } from "../common/utils";
import DeleteInvoice from "../popups/DeleteInvoice";

const EditInvoice = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { isDesktop } = useUserContext();

  const [invoiceDetails, setInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [manualEntryArr, setManualEntryArr] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>({ value: 0 });
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [reference, setReference] = useState<string>("");
  const [amount, setAmount] = useState<any>(0);
  const [amountDue, setAmountDue] = useState<any>(0);
  const [amountPaid, setAmountPaid] = useState<any>(0);
  const [discount, setDiscount] = useState<any>(0);
  const [tax, setTax] = useState<any>(0);
  const [issueDate, setIssueDate] = useState<any>();
  const [dueDate, setDueDate] = useState<any>();
  const [showSendInvoiceModal, setShowSendInvoiceModal] =
    useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR =
    "Please select client and enter invoice number to proceed";

  const fetchInvoice = async () => {
    try {
      const { data } = await invoicesApi.editInvoice(params.id);
      setInvoiceDetails(data);
      setReference(data.reference);
      setIssueDate(Date.parse(data.issueDate));
      setDueDate(Date.parse(data.dueDate));
      setSelectedLineItems(unmapLineItems(data.invoiceLineItems));
      setAmount(data.amount);
      setInvoiceNumber(data.invoiceNumber);
      setDiscount(data.discount);
      setSelectedClient(data.client);
      setAmountDue(data.amountDue);
      setAmountPaid(data.amountPaid);
    } catch {
      navigate("/invoices/error");
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchInvoice();
  }, []);

  const updateInvoice = async () => {
    try {
      const res = await invoicesApi.updateInvoice(invoiceDetails.id, {
        invoice_number: invoiceNumber || invoiceDetails.invoiceNumber,
        reference: reference || invoiceDetails.reference,
        issue_date: dayjs(issueDate || invoiceDetails.issueDate).format(
          "DD.MM.YYYY"
        ),
        due_date: dayjs(dueDate || invoiceDetails.dueDate).format("DD.MM.YYYY"),
        amount_due: amountDue,
        amount_paid: amountPaid,
        amount,
        discount: Number(discount),
        tax: tax || invoiceDetails.tax,
        client_id: selectedClient.value,
        invoice_line_items_attributes: generateInvoiceLineItems(
          selectedLineItems,
          manualEntryArr
        ),
      });

      return res;
    } catch {
      navigate(`/invoices/${invoiceDetails.id}`);

      return {};
    }
  };

  const handleSaveInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      await updateInvoice();
      navigate(`/invoices/${invoiceDetails.id}`);
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
    }

    if (selectedClient) {
      return Toastr.error(INVOICE_NUMBER_ERROR);
    }

    return Toastr.error(SELECT_CLIENT_ERROR);
  };

  if (invoiceDetails) {
    if (isDesktop) {
      return (
        <Fragment>
          <Header
            showMoreButton
            formType="edit"
            handleSaveInvoice={handleSaveInvoice}
            handleSendInvoice={handleSendInvoice}
            id={invoiceDetails.id}
            invoiceNumber={invoiceDetails.invoiceNumber}
            setShowInvoiceSetting={false}
            deleteInvoice={() => {
              setShowDeleteDialog(true);
              setInvoiceToDelete(invoiceDetails.id);
            }}
          />
          <div className="m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
            <CompanyInfo company={invoiceDetails.company} />
            <InvoiceDetails
              optionSelected
              amount={amount}
              clientList={invoiceDetails.companyClientList}
              clientVisible={false}
              currency={invoiceDetails.company.currency}
              dateFormat={invoiceDetails.company.dateFormat}
              dueDate={dueDate || invoiceDetails.dueDate}
              invoiceNumber={invoiceNumber}
              issueDate={issueDate || invoiceDetails.issueDate}
              reference={reference}
              selectedClient={selectedClient || invoiceDetails.client}
              setDueDate={setDueDate}
              setInvoiceNumber={setInvoiceNumber}
              setIssueDate={setIssueDate}
              setReference={setReference}
              setSelectedClient={setSelectedClient}
            />
            <div className="py-5 pl-10">
              <InvoiceTable
                currency={invoiceDetails.company.currency}
                dateFormat={invoiceDetails.company.dateFormat}
                lineItems={lineItems}
                manualEntryArr={manualEntryArr}
                selectedClient={selectedClient || invoiceDetails.client}
                selectedLineItems={selectedLineItems}
                setLineItems={setLineItems}
                setManualEntryArr={setManualEntryArr}
                setSelectedLineItems={setSelectedLineItems}
              />
            </div>
            <InvoiceTotal
              amountDue={amountDue}
              amountPaid={amountPaid}
              currency={invoiceDetails.company.currency}
              discount={discount}
              manualEntryArr={manualEntryArr}
              newLineItems={selectedLineItems}
              setAmount={setAmount}
              setAmountDue={setAmountDue}
              setDiscount={setDiscount}
              setTax={setTax}
              tax={tax || invoiceDetails.tax}
            />
          </div>
          {showSendInvoiceModal && (
            <SendInvoice
              handleSaveSendInvoice={handleSaveSendInvoice}
              isSending={showSendInvoiceModal}
              setIsSending={setShowSendInvoiceModal}
              invoice={{
                id: invoiceDetails.id,
                client: selectedClient,
                company: invoiceDetails?.company,
                dueDate,
                invoiceNumber,
                amount,
              }}
            />
          )}
          {showDeleteDialog && (
            <DeleteInvoice
              invoice={invoiceToDelete}
              setShowDeleteDialog={setShowDeleteDialog}
            />
          )}
        </Fragment>
      );
    }

    return (
      <EditInvoiceForm
        amount={amount}
        amountDue={amountDue}
        amountPaid={amountPaid}
        discount={discount}
        dueDate={dueDate}
        handleSaveInvoice={handleSaveInvoice}
        invoiceDetails={invoiceDetails}
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        lineItems={lineItems}
        manualEntryArr={manualEntryArr}
        reference={reference}
        selectedClient={selectedClient}
        selectedLineItems={selectedLineItems}
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
        setSelectedLineItems={setSelectedLineItems}
        setTax={setTax}
        tax={tax}
      />
    );
  }

  return <div />;
};

export default EditInvoice;
