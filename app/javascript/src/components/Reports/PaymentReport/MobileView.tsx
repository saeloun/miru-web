import React from "react";

import EmptyStates from "common/EmptyStates";
import { i18n } from "../../../i18n";
import type { Payment } from "../../../types/payment";

import ReportMobileRow from "./ReportMobileRow";

interface MobileViewProps {
  currency: string;
  payments: Payment[];
}

const MobileView = ({ currency, payments }: MobileViewProps) =>
  payments.length ? (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b py-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        <span>{i18n.t("client")}</span>
        <span>{i18n.t("amount")}</span>
      </div>
      {payments.map(payment => (
        <ReportMobileRow
          currency={currency}
          key={payment.id}
          payment={payment}
        />
      ))}
    </div>
  ) : (
    <div className="md:hidden">
      <EmptyStates
        Message={i18n.t("reports.noPaymentsFoundForSelectedPeriod")}
        showNoSearchResultState={false}
      />
    </div>
  );

export default MobileView;
