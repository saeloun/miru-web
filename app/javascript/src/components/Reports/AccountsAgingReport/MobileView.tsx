import React from "react";

import EmptyStates from "common/EmptyStates";
import { i18n } from "../../../i18n";

import ReportMobileRow, { ClientAgingMobileRow } from "./ReportMobileRow";

interface MobileViewProps {
  clients: ClientAgingMobileRow[];
  currency: string;
}

const MobileView = ({ clients, currency }: MobileViewProps) =>
  clients.length ? (
    <div className="sm:hidden">
      <div className="flex items-center justify-between border-b py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        <span>{i18n.t("reports.clientHeader")}</span>
        <span>{i18n.t("reports.totalDue")}</span>
      </div>
      {clients.map(client => (
        <ReportMobileRow client={client} currency={currency} key={client.id} />
      ))}
    </div>
  ) : (
    <div className="sm:hidden">
      <EmptyStates
        Message={i18n.t("reports.noClientsWithOutstandingBalances")}
        showNoSearchResultState={false}
      />
    </div>
  );

export default MobileView;
