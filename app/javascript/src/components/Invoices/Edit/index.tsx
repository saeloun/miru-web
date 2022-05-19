import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import clientsApi from "apis/clients";
import invoicesApi from "apis/invoices";
import dayjs from "dayjs";
import Header from "./Header";
import InvoiceTable from "./InvoiceTable";
import CompanyInfo from "../CompanyInfo";
import InvoiceDetails from "../Generate/InvoiceDetails";
import InvoiceTotal from "../Generate/InvoiceTotal";
import InvoiceLineItems from "../Invoice/InvoiceLineItems";

const EditInvoice = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [invoiceDetails, getInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>({ value: 0 });
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [reference] = useState<any>("");
  const [amount, setAmount] = useState<any>(0);
  const [amountDue, setAmountDue] = useState<any>(0);
  const [amountPaid] = useState<any>(0);
  const [discount, setDiscount] = useState<any>(0);
  const [tax, setTax] = useState<any>(0);
  const [issueDate, setIssueDate] = useState();
  const [dueDate, setDueDate] = useState();

  const addKeyToLineItems = items => (
    items.map((item, index) => {
      item["key"] = index;
      return item;
    })
  );

  const fetchInvoice = async (navigate, getInvoiceDetails) => {
    try {
      const res = await invoicesApi.editInvoice(params.id);

      getInvoiceDetails(res.data);
      setLineItems(addKeyToLineItems(res.data.lineItems));
      setAmount(res.data.amount);
      setSelectedClient(res.data.client);
      setAmountDue(res.data.amountDue);
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
      setLineItems(addKeyToLineItems(res.data.lineItems));
    } catch (e) {
      navigate("/invoices/error");
      return {};
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchInvoice(navigate, getInvoiceDetails);
  }, []);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    if (selectedClient.value != 0) {
      fetchNewLineItems(navigate, selectedClient.value, setSelectedClient, setLineItems);
    }
  }, [selectedClient.value]);

  const updateInvoice = () => {
    invoicesApi.updateInvoice(invoiceDetails.id, {
      invoice_number: invoiceNumber || invoiceDetails.invoiceNumber,
      issue_date: dayjs(issueDate || invoiceDetails.issueDate).format("DD.MM.YYYY"),
      due_date: dayjs(dueDate || invoiceDetails.dueDate).format("DD.MM.YYYY"),
      amount_due: amountDue || invoiceDetails.amountDue,
      amount_paid: amountPaid || invoiceDetails.amountPaid,
      amount: amount,
      discount: discount || invoiceDetails.discount,
      tax: tax || invoiceDetails.tax,
      client_id: selectedClient.value,
      invoice_line_items_attributes: selectedLineItems.map(item => ({
        name: `${item.first_name} ${item.last_name}`,
        description: item.description,
        date: item.date,
        rate: item.rate,
        quantity: item.qty,
        timesheet_entry_id: item.time_sheet_entry
      }))
    })
      .then(() => navigate(`/invoices/${invoiceDetails.id}`))
      .catch();
  };

  if (invoiceDetails) {
    return (
      <React.Fragment>
        <Header
          invoiceNumber={invoiceDetails.invoiceNumber}
          id={invoiceDetails.id}
          updateInvoice={updateInvoice}
        />
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          <CompanyInfo company={invoiceDetails.company} />
          <InvoiceDetails
            currency={invoiceDetails.company.currency}
            clientList={invoiceDetails.companyClientList}
            selectedClient={selectedClient || invoiceDetails.client}
            setSelectedClient={setSelectedClient}
            amount={amount}
            dueDate={dueDate || invoiceDetails.dueDate}
            setDueDate={setDueDate}
            issueDate={issueDate || invoiceDetails.issueDate}
            setIssueDate={setIssueDate}
            invoiceNumber={invoiceNumber || invoiceDetails.invoiceNumber}
            setInvoiceNumber={setInvoiceNumber}
            reference={reference}
            optionSelected={true}
            clientVisible={false}
          />
          <div className="px-10 py-5">
            <InvoiceTable
              lineItems={lineItems}
              setLineItems={setLineItems}
              selectedLineItems={selectedLineItems}
              setSelectedLineItems={setSelectedLineItems}
            />
          </div>
          <InvoiceLineItems
            items={invoiceDetails.invoiceLineItems}
            showHeader={false}
          />
          <InvoiceTotal
            currency={invoiceDetails.company.currency}
            newLineItems={selectedLineItems}
            setAmount={setAmount}
            invoiceAmount={invoiceDetails.amount}
            amountPaid={amountPaid || invoiceDetails.amountPaid}
            amountDue={amountDue || invoiceDetails.amountDue}
            setAmountDue={setAmountDue}
            discount={discount || invoiceDetails.discount}
            setDiscount={setDiscount}
            tax={tax || invoiceDetails.tax}
            setTax={setTax}
            invoiceLineItems={invoiceDetails.invoiceLineItems}
            showDiscountInput={!!invoiceDetails.discount}
            showTax={!!invoiceDetails.tax}
          />
        </div>
      </React.Fragment>
    );
  }
  return <></>;
};

export default EditInvoice;
