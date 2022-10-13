import React from "react";

import { Wallet } from "phosphor-react";
import { Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const Header = ({ invoice, stripeUrl }) => (
  <>
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
          <a href={stripeUrl}>
            <button
              className="flex flex-row justify-center items-center bg-miru-han-purple-1000 rounded h-10 w-44"
            >
              <div className="flex flex-row justify-between items-center">
                <div className="mr-1">
                  <Wallet size={16} color="white" weight="bold" />
                </div>
                <p className="font-bold tracking-widest text-base text-miru-white-1000 ml-1">
                    PAY
                </p>
              </div>
            </button>
          </a>
        </div>
      </div>
    </div>
  </>
);

export default Header;
