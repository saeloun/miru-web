import React, { Fragment, useEffect, useState } from "react";

import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import invoicesApi from "apis/invoices";
import Loader from "common/Loader/index";
import { ApiStatus as InvoiceStatus } from "constants/index";
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
import InvoiceSettings from "../InvoiceSettings";
import ConnectPaymentGateway from "../popups/ConnectPaymentGateway";
import DeleteInvoice from "../popups/DeleteInvoice";

const EditInvoice = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { isDesktop } = useUserContext();

  const [status, setStatus] = useState<InvoiceStatus>(InvoiceStatus.IDLE);
  const [saveSendStatus, setSaveSendStatus] = useState<InvoiceStatus>(
    InvoiceStatus.IDLE
  );
  const [invoiceDetails, setInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [manualEntryArr, setManualEntryArr] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>({ value: 0 });
  const [clientCurrency, setClientCurrency] = useState<string>("USD");
  const [baseCurrencyAmount, setBaseCurrencyAmount] = useState<any>(0);
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
  const [isSendReminder, setIsSendReminder] = useState<boolean>(false);
  const [showInvoiceSetting, setShowInvoiceSetting] = useState<boolean>(false);
  const [isStripeEnabled, setIsStripeEnabled] = useState<boolean>(false);
  const [showConnectPaymentDialog, setShowConnectPaymentDialog] =
    useState<boolean>(false);

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR =
    "Please select client and enter invoice number to proceed";

  const fetchInvoice = async () => {
    try {
      setStatus(InvoiceStatus.LOADING);
      const { data } = await invoicesApi.editInvoice(params.id);
      setInvoiceDetails(data);
      setReference(data.reference);
      setIssueDate(data.issueDate);
      setDueDate(data.dueDate);
      setSelectedLineItems(unmapLineItems(data.invoiceLineItems));
      setAmount(data.amount);
      setInvoiceNumber(data.invoiceNumber);
      setDiscount(data.discount);
      setSelectedClient(data.client);
      setAmountDue(data.amountDue);
      setAmountPaid(data.amountPaid);
      setStatus(InvoiceStatus.SUCCESS);
      setIsStripeEnabled(data.stripeEnabled);
      setBaseCurrencyAmount(data.baseCurrency);
    } catch {
      navigate("/invoices/error");
      setStatus(InvoiceStatus.ERROR);
    }
  };

  useEffect(() => {
    sendGAPageView();
    fetchInvoice();
  }, []);

  const updateInvoice = async () => {
    try {
      setStatus(InvoiceStatus.LOADING);
      const res = await invoicesApi.updateInvoice(invoiceDetails.id, {
        invoice_number: invoiceNumber || invoiceDetails.invoiceNumber,
        reference: reference || invoiceDetails.reference,
        issue_date:
          invoiceDetails.company.dateFormat == "DD-MM-YYYY"
            ? issueDate || invoiceDetails.issueDate
            : dayjs(
                issueDate || invoiceDetails.issueDate,
                invoiceDetails.company.dateFormat
              ).format("DD-MM-YYYY"),
        due_date: dayjs(
          dueDate || invoiceDetails.dueDate,
          invoiceDetails.company.dateFormat
        ).format("DD-MM-YYYY"),
        amount_due: amountDue,
        amount_paid: amountPaid,
        amount,
        base_currency_amount: baseCurrencyAmount,
        discount: Number(discount),
        tax: tax || invoiceDetails.tax,
        client_id: selectedClient.id,
        stripe_enabled: isStripeEnabled,
        invoice_line_items_attributes: generateInvoiceLineItems(
          selectedLineItems,
          manualEntryArr,
          invoiceDetails.company.dateFormat
        ).map(ilt => ({
          id: ilt.id,
          name: ilt.name,
          description: ilt.description,
          date:
            invoiceDetails.company.dateFormat == "DD-MM-YYYY"
              ? ilt.date
              : dayjs(ilt.date).format("DD-MM-YYYY"),
          rate: ilt.rate,
          quantity: ilt.quantity,
          timesheet_entry_id: ilt.timesheet_entry_id,
          _destroy: ilt._destroy,
        })),
      });
      setStatus(InvoiceStatus.SUCCESS);

      return res;
    } catch {
      navigate(`/invoices/${invoiceDetails.id}`);
      setStatus(InvoiceStatus.ERROR);

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
    if (!isStripeEnabled && invoiceNumber !== "") {
      setShowConnectPaymentDialog(true);
    } else if (selectedClient && invoiceNumber && !showConnectPaymentDialog) {
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

  const submitSaveSendInvoice = async (e, invoiceEmail) => {
    e.preventDefault();
    try {
      setSaveSendStatus(InvoiceStatus.LOADING);
      const res = await handleSaveSendInvoice();
      if (res.status === 200) {
        submitSendInvoice(res.data.id, invoiceEmail);
      } else {
        Toastr.error("Send invoice failed");
        setSaveSendStatus(InvoiceStatus.ERROR);
      }
    } catch {
      setSaveSendStatus(InvoiceStatus.ERROR);
    }
  };

  const submitSendInvoice = async (invoiceId, invoiceEmail) => {
    try {
      const payload = { invoice_email: invoiceEmail };
      const resp = await invoicesApi.sendInvoice(invoiceId, payload);
      Toastr.success(resp.data.message);
      setSaveSendStatus(InvoiceStatus.SUCCESS);
    } catch {
      setSaveSendStatus(InvoiceStatus.ERROR);
    }
  };

  if (status === InvoiceStatus.LOADING) {
    return <Loader />;
  }

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
            setIsSendReminder={setIsSendReminder}
            setShowInvoiceSetting={setShowInvoiceSetting}
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
              clientCurrency={clientCurrency}
              clientList={invoiceDetails.companyClientList}
              clientVisible={false}
              dateFormat={invoiceDetails.company.dateFormat}
              dueDate={dueDate || invoiceDetails.dueDate}
              invoiceNumber={invoiceNumber}
              issueDate={issueDate || invoiceDetails.issueDate}
              reference={reference}
              selectedClient={selectedClient || invoiceDetails.client}
              setClientCurrency={setClientCurrency}
              setDueDate={setDueDate}
              setInvoiceNumber={setInvoiceNumber}
              setIssueDate={setIssueDate}
              setReference={setReference}
              setSelectedClient={setSelectedClient}
            />
            <div className="py-5 pl-10">
              <InvoiceTable
                clientCurrency={clientCurrency}
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
              baseCurrencyAmount={baseCurrencyAmount}
              clientCurrency={clientCurrency}
              currency={invoiceDetails.company.currency}
              discount={discount}
              manualEntryArr={manualEntryArr}
              newLineItems={selectedLineItems}
              setAmount={setAmount}
              setAmountDue={setAmountDue}
              setBaseCurrencyAmount={setBaseCurrencyAmount}
              setDiscount={setDiscount}
              setTax={setTax}
              tax={tax || invoiceDetails.tax}
            />
          </div>
          {(showSendInvoiceModal || isSendReminder) &&
            !showConnectPaymentDialog && (
              <SendInvoice
                handleSubmit={submitSaveSendInvoice}
                isSending={showSendInvoiceModal}
                setIsSending={setShowSendInvoiceModal}
                status={saveSendStatus}
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
          {!isStripeEnabled && showConnectPaymentDialog && (
            <ConnectPaymentGateway
              invoice={invoiceDetails}
              setIsSending={setShowSendInvoiceModal}
              setShowConnectPaymentDialog={setShowConnectPaymentDialog}
              showConnectPaymentDialog={showConnectPaymentDialog}
            />
          )}
          {showDeleteDialog && (
            <DeleteInvoice
              invoice={invoiceToDelete}
              setShowDeleteDialog={setShowDeleteDialog}
              showDeleteDialog={showDeleteDialog}
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

    return (
      <EditInvoiceForm
        amount={amount}
        amountDue={amountDue}
        amountPaid={amountPaid}
        baseCurrencyAmount={baseCurrencyAmount}
        discount={discount}
        dueDate={dueDate}
        handleSaveInvoice={handleSaveInvoice}
        invoiceDetails={invoiceDetails}
        invoiceNumber={invoiceNumber}
        isStripeEnabled={isStripeEnabled}
        issueDate={issueDate}
        lineItems={lineItems}
        manualEntryArr={manualEntryArr}
        reference={reference}
        selectedClient={selectedClient}
        selectedLineItems={selectedLineItems}
        setAmount={setAmount}
        setAmountDue={setAmountDue}
        setBaseCurrencyAmount={setBaseCurrencyAmount}
        setDiscount={setDiscount}
        setDueDate={setDueDate}
        setInvoiceNumber={setInvoiceNumber}
        setIssueDate={setIssueDate}
        setLineItems={setLineItems}
        setManualEntryArr={setManualEntryArr}
        setReference={setReference}
        setSelectedClient={setSelectedClient}
        setSelectedLineItems={setSelectedLineItems}
        setShowConnectPaymentDialog={setShowConnectPaymentDialog}
        setTax={setTax}
        showConnectPaymentDialog={showConnectPaymentDialog}
        tax={tax}
      />
    );
  }

  return <div />;
};

export default EditInvoice;
