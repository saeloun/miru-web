import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import invoicesApi from "apis/invoices";
import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";
import { ApiStatus as InvoiceStatus } from "../../../constants";

const Invoice = () => {
  const params = useParams();

  const [status, setStatus] = React.useState<InvoiceStatus>(
    InvoiceStatus.IDLE
  );
  const [invoice, setInvoice] = useState<any>();

  const fetchInvoice = async () => {
    try {
      setStatus(InvoiceStatus.LOADING);
      const res = await invoicesApi.getInvoice(params.id);
      setInvoice(res.data.invoice);
      setStatus(InvoiceStatus.SUCCESS);
    } catch (err) {
      setStatus(InvoiceStatus.ERROR);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchInvoice();
  }, []);

  return (
    status === InvoiceStatus.SUCCESS && (
      <>
        <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
          <Header invoice={invoice} />
          <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
            <InvoiceDetails invoice={invoice}/>
          </div>
        </div>
      </>
    )
  );
};

export default Invoice;
