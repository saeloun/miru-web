import React from "react";

import EmptyStates from "common/EmptyStates";
import { i18n } from "../../../i18n";

import ReportMobileRow, {
  OutstandingInvoiceMobileRow,
} from "./ReportMobileRow";

interface MobileViewProps {
  baseCurrency: string;
  onSelectClient: (clientId: string) => void;
  rows: OutstandingInvoiceMobileRow[];
}

const MobileView = ({ baseCurrency, onSelectClient, rows }: MobileViewProps) =>
  rows.length ? (
    <div className="sm:hidden">
      <div className="flex items-center justify-between border-b py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        <span>{i18n.t("reports.clientHeader")}</span>
        <span>{i18n.t("amount")}</span>
      </div>
      {rows.map(row => (
        <ReportMobileRow
          baseCurrency={baseCurrency}
          key={row.invoice.id || row.invoice.invoice_number}
          onSelectClient={onSelectClient}
          row={row}
        />
      ))}
    </div>
  ) : (
    <div className="sm:hidden">
      <EmptyStates
        Message={i18n.t("reports.noOutstandingOrOverdueInvoices")}
        showNoSearchResultState={false}
      />
    </div>
  );

export default MobileView;
