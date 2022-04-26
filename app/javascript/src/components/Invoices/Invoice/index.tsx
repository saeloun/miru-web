import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import invoicesApi from "apis/invoices";
import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const Invoice = () => {
  const params = useParams();

  const [invoice, setInvoice] = useState<any>();

  const fetchInvoice = async () => {
    const res = await invoicesApi.getInvoice(params.id);
    if (res.status === 200) {
      setInvoice(res.data.invoice);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchInvoice();
  }, []);

  return (
    <>
      <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
        { invoice && <Header invoice={invoice} /> }
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          { invoice && <InvoiceDetails invoice={invoice}/> }
        </div>
      </div>
    </>
  );
};

export default Invoice;
