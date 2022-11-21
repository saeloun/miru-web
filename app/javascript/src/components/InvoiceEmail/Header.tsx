import React from "react";

import { ReportsIcon } from "miruIcons";
import { Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const Header = ({ invoice, stripeUrl }) => (
  <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
    <div className="flex flex-row">
      <div className="flex self-center mr-2">
        <p className="text-4xl font-bold">Invoice #{invoice.invoice_number}</p>
      </div>
      <div className="flex self-center ml-2">
        <Badge
          text={invoice.status}
          className={`${getStatusCssClass(invoice.status)} uppercase`}
        />
      </div>
    </div>
    <div className="flex flex-row justify-items-right">
      <div className="flex flex-col justify-items-center send-button-container ml-1">
        <button
          disabled={invoice.status == "paid"}
          className={`flex flex-row justify-center items-center rounded h-10 w-44
            ${
              invoice.status == "paid"
                ? "bg-indigo-100 cursor-not-allowed"
                : "bg-miru-han-purple-1000"
            }`}
          onClick={() => {
            invoice.status != "paid" && (location.href = stripeUrl);
          }}
        >
          <div className="flex flex-row justify-between items-center">
            <div className="mr-1">
              <ReportsIcon size={16} color="white" weight="bold" />
            </div>
            <p className="font-bold tracking-widest text-base text-miru-white-1000 ml-1">
              PAY
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default Header;
