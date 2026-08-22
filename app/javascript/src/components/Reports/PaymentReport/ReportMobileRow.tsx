import React from "react";

import { format } from "date-fns";

import { Divider } from "common/Divider";
import { currencyFormat } from "helpers";
import { i18n } from "../../../i18n";
import type { Payment } from "../../../types/payment";
import { StatusBadge } from "../../ui/status-badge";

interface ReportMobileRowProps {
  currency: string;
  payment: Payment;
}

const ReportMobileRow = ({ currency, payment }: ReportMobileRowProps) => (
  <div>
    <div className="min-h-20 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-foreground">
            {payment.client_name}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {payment.invoice_number}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end text-right">
          <p className="whitespace-nowrap text-base font-bold text-foreground">
            {currencyFormat(currency, payment.amount)}
          </p>
          <StatusBadge
            className="mt-2 capitalize"
            status={payment.status === "completed" ? "paid" : payment.status}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>
          {payment.payment_date
            ? format(new Date(payment.payment_date), "MMM dd, yyyy")
            : i18n.t("reports.selectedPeriod")}
        </p>
        <p className="truncate text-right">{payment.payment_method}</p>
      </div>
    </div>
    <Divider />
  </div>
);

export default ReportMobileRow;
