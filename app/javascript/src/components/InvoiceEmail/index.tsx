import React, { useState, useEffect } from "react";
import invoicesApi from "apis/invoices";
import Header from "./Header";
import InvoiceDetails from "../Invoices/Invoice/InvoiceDetails";
const Instagram = require("../../../../assets/images/Instagram.svg"); // eslint-disable-line
const Twitter = require("../../../../assets/images/Twitter.svg"); // eslint-disable-line
const MiruLogowithText = require("../../../../assets/images/MiruWhiteLogowithText.svg"); // eslint-disable-line

const InvoiceEmail = ( { url } ) => {
  const [invoice, setInvoice] = useState<any>({
    amount: "5000.0",
    amountDue: "5000.0",
    amountPaid: "0.0",
    client: {
      id: 1,
      name: "client_1_saeloun_India",
      email: "client_one@saeloun_india.com",
      phone: "+91 9999999991",
      address: "Somewhere on Earth"
    },
    company: {
      address: "somewhere in India",
      country: "IN",
      currency: "INR",
      id: 1,
      logo: "http://localhost:3000/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCZz09IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--4b4e594ee8e7fad4293d04e74fdeaeb1c789bdd8/saeloun_logo.png",
      name: "Saeloun India Pvt. Ltd",
      phoneNumber: "+91 0000000000"
    },
    discount: "0.0",
    dueDate: "2022-06-16",
    id: 5,
    invoiceLineItems: [
      {
        date: "2022-03-25",
        description: "Worked on Project_1_Client_1_saeloun_India",
        id: 1,
        name: "Vipul A M",
        quantity: 60,
        rate: "5000.0",
        timesheetEntryId: 1
      }
    ],
    invoiceNumber: "SA-HR-010",
    issueDate: "2022-05-16",
    reference: "",
    status: "draft",
    tax: "0.0"
  });

  const fetchInvoice = async () => { // eslint-disable-line
    try {
      const res = await invoicesApi.getInvoice("8");
      setInvoice(res.data);
    } catch (err) {} // eslint-disable-line
  };

  useEffect(()=> {
    //fetchInvoice();
  },[]);

  return (
    <>
      <div className="font-manrope px-10 flex justify-start bg-miru-han-purple-1000 text-white">
        <img src={MiruLogowithText} />
      </div>
      <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
        <Header invoice={invoice} stripeUrl={url}/>
        <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
          <InvoiceDetails invoice={invoice} />
        </div>
      </div>
      <div className="font-manrope px-10 py-3 flex justify-between bg-miru-han-purple-1000 text-white">
        <span className="text-xs font-normal leading-4 text-center">
          © Miru 2022. All rights reserved.
        </span>
        <span className="flex justify-between w-1/4 text-xs font-normal leading-4 text-center">
          www.getmiru.com/
          <img src={Instagram} height="16px" width="16px" />
          <img src={Twitter} height="16px" width="16px" />
        </span>
      </div>
    </>
  );
};

export default InvoiceEmail;
