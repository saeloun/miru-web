import React, { useEffect, useState } from "react";

import invoicesApi from "apis/invoices";
import ConnectPaymentGateway from "components/Invoices/popups/ConnectPaymentGateway";
import { mapGenerateInvoice } from "mapper/mappedIndex";
import { Toastr } from "StyledComponents";

import AddLineItemContainer from "./AddLineItemContainer";
import InvoicePreviewContainer from "./InvoicePreview";
import MenuContainer from "./MenuContainer";
import MultiLineContainer from "./MultiLineContainer";
import SendInvoiceContainer from "./SendInvoiceContainer";

import { generateInvoiceLineItems } from "../../../common/utils";
import { sections } from "../utils";

const Container = ({
  baseCurrency,
  baseCurrencyAmount,
  clientCurrency,
  dueDate,
  issueDate,
  invoiceDetails,
  invoiceNumber,
  reference,
  selectedClient,
  setReference,
  setSelectedClient,
  dateFormat,
  setDueDate,
  setIssueDate,
  setInvoiceNumber,
  activeSection,
  setActiveSection,
  setManualEntryArr,
  manualEntryArr,
  lineItems,
  setLineItems,
  selectedLineItems,
  setSelectedLineItems,
  amount,
  amountDue,
  amountPaid,
  discount,
  setAmount,
  setAmountDue,
  setDiscount,
  setTax,
  tax,
  handleSaveInvoice,
  isStripeEnabled,
  setShowConnectPaymentDialog,
  setBaseCurrencyAmount,
  setClientCurrency,
  showConnectPaymentDialog,
}) => {
  const [multiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<any>({});
  const [isInvoicePreviewCall, setIsInvoicePreviewCall] =
    useState<boolean>(true);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [invoiceId, setInvoiceId] = useState<number>(null);
  const [showSendInvoiceModal, setShowSendInvoiceModal] =
    useState<boolean>(true);

  const currency = clientCurrency || invoiceDetails?.company?.currency;

  const INVOICE_NUMBER_ERROR = "Please enter invoice number to proceed";
  const SELECT_CLIENT_ERROR =
    "Please select client and enter invoice number to proceed";

  const saveInvoice = async () => {
    const sanitized = mapGenerateInvoice({
      baseCurrencyAmount,
      selectedClient,
      invoiceNumber,
      reference,
      issueDate,
      dueDate,
      invoiceLineItems: generateInvoiceLineItems(
        selectedLineItems,
        manualEntryArr,
        dateFormat
      ),
      amount,
      amountDue,
      amountPaid,
      discount,
      tax,
      dateFormat,
      setShowSendInvoiceModal,
    });

    return await invoicesApi.post(sanitized);
  };

  const handleSaveSendInvoice = async () => {
    if (selectedClient && invoiceNumber !== "") {
      const res = await saveInvoice();
      setInvoiceId(res?.data.id);
      setActiveSection(sections.sendInvoice);

      return res;
    }

    if (selectedClient) {
      return Toastr.error(INVOICE_NUMBER_ERROR);
    }

    return Toastr.error(SELECT_CLIENT_ERROR);
  };

  const handleSendButtonClick = () => {
    if (!showConnectPaymentDialog && !isStripeEnabled && showSendInvoiceModal) {
      return setShowConnectPaymentDialog(true);
    }

    if (selectedClient && invoiceNumber !== "") {
      return setActiveSection(sections.sendInvoice);
    }

    if (selectedClient) {
      return Toastr.error(INVOICE_NUMBER_ERROR);
    }

    return Toastr.error(SELECT_CLIENT_ERROR);
  };

  useEffect(() => {
    if (activeSection == sections.generateInvoice) {
      setMultiLineItemModal(false);
    }
  }, [activeSection]);

  const getContainerComponent = () => {
    switch (activeSection) {
      case sections.generateInvoice:
        return (
          <MenuContainer
            amountDue={amountDue}
            amountPaid={amountPaid}
            baseCurrency={baseCurrency}
            baseCurrencyAmount={baseCurrencyAmount}
            currency={clientCurrency}
            dateFormat={dateFormat}
            discount={discount}
            dueDate={dueDate}
            handleSaveInvoice={handleSaveInvoice}
            handleSendButtonClick={handleSendButtonClick}
            invoiceDetails={invoiceDetails}
            invoiceNumber={invoiceNumber}
            isInvoicePreviewCall={isInvoicePreviewCall}
            issueDate={issueDate}
            manualEntryArr={manualEntryArr}
            reference={reference}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setAmount={setAmount}
            setAmountDue={setAmountDue}
            setBaseCurrencyAmount={setBaseCurrencyAmount}
            setClientCurrency={setClientCurrency}
            setDiscount={setDiscount}
            setDueDate={setDueDate}
            setEditItem={setEditItem}
            setInvoiceNumber={setInvoiceNumber}
            setIsInvoicePreviewCall={setIsInvoicePreviewCall}
            setIssueDate={setIssueDate}
            setReference={setReference}
            setSelectedClient={setSelectedClient}
            setSubTotal={setSubTotal}
            setTax={setTax}
            setTotal={setTotal}
            subTotal={subTotal}
            tax={tax}
            total={total}
          />
        );
      case sections.addLineItem:
        return (
          <AddLineItemContainer
            dateFormat={dateFormat}
            editItem={editItem}
            lineItems={lineItems}
            manualEntryArr={manualEntryArr}
            multiLineItemModal={multiLineItemModal}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setEditItem={setEditItem}
            setLineItems={setLineItems}
            setManualEntryArr={setManualEntryArr}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedLineItems={setSelectedLineItems}
          />
        );
      case sections.editLineItem:
        return (
          <AddLineItemContainer
            dateFormat={dateFormat}
            editItem={editItem}
            lineItems={lineItems}
            manualEntryArr={manualEntryArr}
            multiLineItemModal={multiLineItemModal}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setEditItem={setEditItem}
            setLineItems={setLineItems}
            setManualEntryArr={setManualEntryArr}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedLineItems={setSelectedLineItems}
          />
        );
      case sections.multipleEntries:
        return (
          <MultiLineContainer
            dateFormat={dateFormat}
            multiLineItemModal={multiLineItemModal}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedLineItems={setSelectedLineItems}
          />
        );
      case sections.invoicePreview:
        return (
          <InvoicePreviewContainer
            amount={amount}
            amountDue={amountDue}
            amountPaid={amountPaid}
            currency={currency}
            discount={discount}
            dueDate={dueDate}
            handleSaveInvoice={handleSaveInvoice}
            handleSendButtonClick={handleSendButtonClick}
            invoiceDetails={invoiceDetails}
            invoiceNumber={invoiceNumber}
            isInvoicePreviewCall={isInvoicePreviewCall}
            issueDate={issueDate}
            manualEntryArr={manualEntryArr}
            reference={reference}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setEditItem={setEditItem}
            subTotal={subTotal}
            tax={tax}
            total={total}
          />
        );
      case sections.sendInvoice:
        return showConnectPaymentDialog && !isStripeEnabled ? (
          <ConnectPaymentGateway
            invoice={invoiceDetails}
            setIsSending={setShowSendInvoiceModal}
            setShowConnectPaymentDialog={setShowConnectPaymentDialog}
            showConnectPaymentDialog={showConnectPaymentDialog}
          />
        ) : (
          showSendInvoiceModal && (
            <SendInvoiceContainer
              handleSaveSendInvoice={handleSaveSendInvoice}
              setIsSending={setShowSendInvoiceModal}
              invoice={{
                id: invoiceId,
                client: selectedClient,
                company: invoiceDetails?.companyDetails
                  ? invoiceDetails?.companyDetails
                  : invoiceDetails?.company,
                dueDate,
                invoiceNumber,
                amount,
              }}
            />
          )
        );
    }
  };

  return getContainerComponent();
};

export default Container;
