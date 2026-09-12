import React from "react";

import { ReportsIcon } from "miruIcons";
import { Badge, Tooltip } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";
import type { Invoice } from "../../types/invoice";
import { i18n } from "../../i18n";

const Header = ({
  invoice,
  stripeUrl,
  upiPayment,
  razorpayPayment,
  paypalPayment,
  isStripeConnected,
  setIsInvoiceEmail,
  setShowConnectPaymentDialog,
  setShowStripeDisabledDialog,
}: InvoiceEmailProps) => {
  const isNonActionable =
    invoice.status == "paid" ||
    invoice.status == "waived" ||
    invoice.amount <= 0;

  const hasOtherProvider =
    !!isStripeConnected ||
    !!razorpayPayment?.enabled ||
    !!upiPayment?.payment_link;
  const paypalEnabled = !!paypalPayment?.enabled && !!paypalPayment?.url;
  const paypalOnly = paypalEnabled && !hasOtherProvider;

  const startPayment = () => {
    if (invoice.status == "paid") return;

    if (isStripeConnected && !invoice.stripe_enabled) {
      setShowStripeDisabledDialog(true);
    } else if (isStripeConnected || razorpayPayment?.enabled) {
      window.location.href = stripeUrl;
    } else if (upiPayment?.payment_link) {
      window.location.href = upiPayment.payment_link;
    } else if (paypalEnabled) {
      window.location.href = paypalPayment.url;
    } else {
      setIsInvoiceEmail(true);
      setShowConnectPaymentDialog(true);
    }
  };

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-row">
        <div className="mr-2 flex self-center">
          <p className="text-2xl font-semibold tracking-tight">
            Invoice #{invoice.invoice_number}
          </p>
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
                  <p className="ml-1 text-base font-bold tracking-widest text-primary-foreground">
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
                  : "bg-primary"
              }`}
              onClick={startPayment}
            >
              <div className="flex flex-row items-center justify-between">
                <div className="mr-1">
                  <ReportsIcon color="white" size={16} weight="bold" />
                </div>
                <p className="ml-1 text-base font-bold tracking-widest text-primary-foreground">
                  {paypalOnly ? i18n.t("invoices.payWithPaypal") : "PAY"}
                </p>
              </div>
            </button>
          )}
        </div>
        {paypalEnabled && !paypalOnly && !isNonActionable && (
          <a
            className="ml-2 flex h-10 flex-row items-center justify-center rounded border border-primary bg-background px-4 text-sm font-semibold text-primary"
            href={paypalPayment.url}
          >
            {i18n.t("invoices.payWithPaypal")}
          </a>
        )}
      </div>
    </div>
  );
};

interface InvoiceEmailProps {
  invoice: Invoice;
  stripeUrl: string;
  upiPayment?: { payment_link?: string };
  razorpayPayment?: { enabled?: boolean };
  paypalPayment?: { enabled?: boolean; url?: string };
  isStripeConnected: boolean;
  setIsInvoiceEmail: (_value) => void;
  setShowConnectPaymentDialog: (_value) => void;
  setShowStripeDisabledDialog: (_value) => void;
}

export default Header;
