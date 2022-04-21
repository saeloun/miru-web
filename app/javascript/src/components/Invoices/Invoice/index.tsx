import React from "react";
import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const Invoice = ({ invoice }) => (
  <>
    <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
      <Header invoice={invoice} />
      <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
        <InvoiceDetails invoice={invoice}/>
      </div>
    </div>
  </>
);

export default Invoice;
