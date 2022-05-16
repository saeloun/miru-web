import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import invoicesApi from "apis/invoices";
import Header from "./Header";
import InvoiceTable from "./InvoiceTable";
import CompanyInfo from "../CompanyInfo";
import InvoiceDetails from "../Generate/InvoiceDetails";
import InvoiceTotal from "../Generate/InvoiceTotal";

const EditInvoice = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [invoiceDetails, getInvoiceDetails] = useState<any>();
  const [lineItems, setLineItems] = useState<any>([]);
  const [selectedLineItems, setSelectedLineItems] = useState<any>([]);
  const [selectedClient, setSelectedClient] = useState<any>();
  const [invoiceNumber, setInvoiceNumber] = useState<any>("");
  const [reference, setReference] = useState<any>("");
  const [amount, setAmount] = useState<any>(0);
  const [outstandingAmount, setOutstandingAmount] = useState<any>(0);
  const [amountDue, setAmountDue] = useState<any>(0);
  const [amountPaid, setAmountPaid] = useState<any>(0);
  const [discount, setDiscount] = useState<any>(0);
  const [tax, setTax] = useState<any>(0);
  const [issueDate, setIssueDate] = useState();
  const [dueDate, setDueDate] = useState();
  const [selectedOption, setSelectedOption] = useState<any>([]);

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

  if (invoiceDetails) {
    return (
      <React.Fragment>
        <Header
          invoiceNumber={invoiceDetails.invoiceNumber}
          id={invoiceDetails.id}
        />
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          <CompanyInfo company={invoiceDetails.company} />
          <InvoiceDetails
            currency={invoiceDetails.company.currency}
            clientList={invoiceDetails.companyClientList}
            selectedClient={invoiceDetails.client}
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
          <InvoiceTotal
            currency={invoiceDetails.company.currency}
            newLineItems={selectedLineItems}
            setAmount={setAmount}
            amount={amount}
            invoiceAmount={invoiceDetails.amount}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            amountDue={amountDue}
            setAmountDue={setAmountDue}
            discount={discount}
            setDiscount={setDiscount}
            tax={tax}
            setTax={setTax}
          />
        </div>
      </React.Fragment>
    );
  }
  return <></>;
};

export default EditInvoice;
