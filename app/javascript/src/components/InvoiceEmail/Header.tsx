import React from "react";

import { ReportsIcon } from "miruIcons";
import { Badge, Tooltip } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const Header = ({
  invoice,
  stripeUrl,
  isStripeConnected,
  setIsInvoiceEmail,
  setShowConnectPaymentDialog,
  setShowStripeDisabledDialog,
}: InvoiceEmailProps) => (
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
        {invoice.status == "waived" || invoice.amount <= 0 ? (
          <Tooltip
            content="This invoice has been waived off by the sender"
            wrapperClassName="relative block max-w-full "
          >
            <button
              disabled
              className="flex h-10 w-44 cursor-not-allowed flex-row items-center justify-center rounded bg-indigo-100"
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
          </Tooltip>
        ) : (
          <button
            disabled={invoice.status == "paid"}
            className={`flex h-10 w-44 flex-row items-center justify-center rounded
              ${
                invoice.status == "paid"
                  ? "cursor-not-allowed bg-indigo-100"
                  : "bg-miru-han-purple-1000"
              }`}
            onClick={() => {
              if (invoice.status != "paid") {
                if (isStripeConnected && !invoice.stripe_enabled) {
                  setShowStripeDisabledDialog(true);
                } else if (isStripeConnected) {
                  window.location.href = stripeUrl;
                } else {
                  setIsInvoiceEmail(true);
                  setShowConnectPaymentDialog(true);
                }
              }
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
        )}
      </div>
    </div>
  </div>
);

interface Invoice {
  invoice_number: number;
  status: string;
  amount: number;
  stripe_enabled: boolean;
}

interface InvoiceEmailProps {
  invoice: Invoice;
  stripeUrl: string;
  isStripeConnected: boolean;
  setIsInvoiceEmail: (_value) => void;
  setShowConnectPaymentDialog: (_value) => void;
  setShowStripeDisabledDialog: (_value) => void;
}

export default Header;
