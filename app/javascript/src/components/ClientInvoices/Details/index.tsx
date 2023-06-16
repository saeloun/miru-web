import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import invoicesApi from "apis/invoices";
import Loader from "common/Loader";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const ClientInvoiceDetails = () => {
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchViewInvoice();
  }, []);

  const fetchViewInvoice = async () => {
    const res = await invoicesApi.viewInvoice(params.id);
    setData(res.data);
    setLoading(false);
  };

  if (loading) {
    return <Loader />;
  }

  const { url, invoice, logo, lineItems, company, client } = data;

  return (
    <div className="flex flex-col justify-between">
      <div className="mx-auto max-w-6xl px-2 font-manrope md:px-11">
        <Header invoice={invoice} stripeUrl={url} />
        <div className="m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
          <InvoiceDetails
            client={client}
            company={company}
            invoice={invoice}
            lineItems={lineItems}
            logo={logo}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInvoiceDetails;
