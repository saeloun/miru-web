import React from "react";

import {
  ArrowRight,
  CreditCard,
  QrCode,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

import { i18n } from "../../../i18n";

interface PaymentSetupPromptProps {
  isDesktop: boolean;
}

const PaymentSetupPrompt = ({ isDesktop }: PaymentSetupPromptProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-background">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {i18n.t("invoices.paymentSetupPromptTitle")}
            </h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {i18n.t("invoices.paymentSetupPromptDescription")}
            </p>
            {isDesktop && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  {i18n.t("invoices.razorpayCardsAndUpi")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  {i18n.t("invoices.freeUpiQr")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {i18n.t("invoices.paymentLinksAndWebhooks")}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          type="button"
          onClick={() =>
            navigate("/settings/payment?provider=razorpay&source=invoices")
          }
        >
          {i18n.t("invoices.setUpRazorpay")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PaymentSetupPrompt;
