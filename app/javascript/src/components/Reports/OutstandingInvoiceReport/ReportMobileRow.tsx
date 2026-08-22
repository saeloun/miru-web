import React from "react";

import { Divider } from "common/Divider";
import { currencyFormat } from "helpers/currency";
import { i18n } from "../../../i18n";
import type { Invoice } from "../../../types/invoice";
import { StatusBadge } from "../../ui/status-badge";

export interface OutstandingInvoiceMobileRow {
  invoice: Invoice;
  originalAmount: number;
  baseAmount: number;
}

interface ReportMobileRowProps {
  baseCurrency: string;
  onSelectClient: (clientId: string) => void;
  row: OutstandingInvoiceMobileRow;
}

const ReportMobileRow = ({
  baseCurrency,
  onSelectClient,
  row,
}: ReportMobileRowProps) => {
  const { invoice, originalAmount, baseAmount } = row;

  return (
    <div>
      <div className="min-h-20 w-full py-4 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {invoice.client_id ? (
              <button
                className="block max-w-full truncate text-left text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                type="button"
                onClick={() => onSelectClient(invoice.client_id)}
              >
                {invoice.client_name || invoice.client?.name}
              </button>
            ) : (
              <p className="truncate text-sm font-semibold text-foreground">
                {invoice.client_name || invoice.client?.name}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {invoice.invoice_number}
            </p>
          </div>
          <StatusBadge
            className="shrink-0 capitalize"
            status={invoice.status}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            {i18n.t("reports.originalAmount")}
          </p>
          <p className="shrink-0 text-right text-sm font-semibold text-foreground">
            {currencyFormat(invoice.currency || baseCurrency, originalAmount)}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            {i18n.t("reports.baseAmount")}
          </p>
          <p className="shrink-0 text-right text-sm font-bold text-foreground">
            {currencyFormat(baseCurrency, baseAmount)}
          </p>
        </div>
      </div>
      <Divider />
    </div>
  );
};

export default ReportMobileRow;
