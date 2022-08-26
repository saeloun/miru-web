import React from "react";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const Instagram = require("../../../../assets/images/Instagram.svg"); // eslint-disable-line
const Twitter = require("../../../../assets/images/Twitter.svg"); // eslint-disable-line
const MiruLogowithText = require("../../../../assets/images/MiruWhiteLogowithText.svg"); // eslint-disable-line

const InvoiceEmail = ({ url, invoice, logo, lineItems, company, client }) => (
  <div className="flex flex-col justify-between">
    <div className="font-manrope px-24 h-16 flex justify-start bg-miru-han-purple-1000 text-white">
      <img src={MiruLogowithText} />
    </div>
    <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
      <Header invoice={invoice} stripeUrl={url} />
      <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
        <InvoiceDetails
          invoice={invoice}
          company={company}
          lineItems={lineItems}
          client={client}
          logo={logo}
        />
      </div>
    </div>
    <div className="font-manrope px-28 py-3 flex justify-between bg-miru-han-purple-1000 text-white">
      <span className="text-xs font-normal leading-4 text-center">
        © AC 2022
      </span>
      {/* <span className="flex justify-between w-1/4 text-xs font-normal leading-4 text-center">
        www.getmiru.com/
        <img src={Instagram} height="16px" width="16px" />
        <img src={Twitter} height="16px" width="16px" />
      </span> */}
    </div>
  </div>
);

export default InvoiceEmail;
