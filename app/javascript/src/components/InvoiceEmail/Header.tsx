import React from "react";

import { ReportsIcon } from "miruIcons";
import { Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const Header = ({ invoice, stripeUrl }) => (
  <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
    <div className="flex flex-row">
      <div className="mr-2 flex self-center">
        <p className="text-4xl font-bold">Invoice #{invoice.invoice_number}</p>
      </div>
      <div className="ml-2 flex self-center">
        <Badge
          className={`${getStatusCssClass(invoice.status)} uppercase`}
          text={invoice.status}
        />
      </div>
    </div>
    <div className="justify-items-right flex flex-row">
      <div className="send-button-container ml-1 flex flex-col justify-items-center">
        <button
          disabled={invoice.status == "paid"}
          className={`flex h-10 w-44 flex-row items-center justify-center rounded
            ${
              invoice.status == "paid"
                ? "cursor-not-allowed bg-indigo-100"
                : "bg-miru-han-purple-1000"
            }`}
          onClick={() => {
            invoice.status != "paid" && (window.location.href = stripeUrl);
          }}
        >
          <div className="flex flex-row items-center justify-between">
            <div className="mr-1">
              <ReportsIcon color="white" size={16} weight="bold" />
            </div>
            <p className="ml-1 text-base font-bold tracking-widest text-miru-white-1000">
              PAY
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default Header;
