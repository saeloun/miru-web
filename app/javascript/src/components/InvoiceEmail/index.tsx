import React from "react";

import { InstagramSVG, TwitterSVG, MiruLogoWithTextSVG } from "miruIcons";

import Header from "./Header";
import InvoiceDetails from "./InvoiceDetails";

const InvoiceEmail = ({ url, invoice, logo, lineItems, company, client }) => (
  <div className="flex flex-col justify-between">
    <div className="flex h-16 justify-start bg-miru-han-purple-1000 px-24 font-manrope text-white">
      <img src={MiruLogoWithTextSVG} />
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
        <img height="16px" src={InstagramSVG} width="16px" />
        <img height="16px" src={TwitterSVG} width="16px" />
      </span>
    </div>
  </div>
);

export default InvoiceEmail;
