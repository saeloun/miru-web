import React from "react";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const Instagram = require("../../../../assets/images/Instagram.svg"); // eslint-disable-line
const Twitter = require("../../../../assets/images/Twitter.svg"); // eslint-disable-line
const MiruLogowithText = require("../../../../assets/images/MiruWhiteLogowithText.svg"); // eslint-disable-line

const InvoiceEmail = ({ url, invoice, logo, lineItems, company, client }) => (
  <div className="flex flex-col justify-between">
    <div className="flex h-16 justify-start bg-miru-han-purple-1000 px-24 font-manrope text-white">
      <img src={MiruLogowithText} />
    </div>
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
    <div className="flex justify-between bg-miru-han-purple-1000 px-28 py-3 font-manrope text-white">
      <span className="text-center text-xs font-normal leading-4">
        © Miru 2022. All rights reserved.
      </span>
      <span className="flex w-1/4 justify-between text-center text-xs font-normal leading-4">
        miru.so/
        <img height="16px" src={Instagram} width="16px" />
        <img height="16px" src={Twitter} width="16px" />
      </span>
    </div>
  </div>
);

export default InvoiceEmail;
