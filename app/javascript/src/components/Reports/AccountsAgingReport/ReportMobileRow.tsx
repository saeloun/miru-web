import React from "react";

import { Divider } from "common/Divider";
import { currencyFormat } from "helpers/currency";
import { i18n } from "../../../i18n";

export interface ClientAgingMobileRow {
  id: number;
  name: string;
  amount_overdue: {
    zero_to_thirty_days: number;
    thirty_one_to_sixty_days: number;
    sixty_one_to_ninety_days: number;
    ninety_plus_days: number;
    total: number;
  };
}

interface ReportMobileRowProps {
  client: ClientAgingMobileRow;
  currency: string;
}

const BUCKETS = [
  { key: "zero_to_thirty_days", label: "reports.zeroToThirtyDays" },
  { key: "thirty_one_to_sixty_days", label: "reports.thirtyOneToSixtyDays" },
  { key: "sixty_one_to_ninety_days", label: "reports.sixtyOneToNinetyDays" },
  { key: "ninety_plus_days", label: "reports.ninetyPlusDays" },
] as const;

const ReportMobileRow = ({ client, currency }: ReportMobileRowProps) => (
  <div>
    <div className="min-h-20 py-4">
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-semibold text-foreground">
          {client.name}
        </p>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-muted-foreground">
            {i18n.t("reports.totalDue")}
          </p>
          <p className="mt-1 whitespace-nowrap text-base font-bold text-foreground">
            {currencyFormat(currency, client.amount_overdue.total)}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {BUCKETS.map(bucket => (
          <div className="flex items-baseline justify-between" key={bucket.key}>
            <p className="text-xs font-medium text-muted-foreground">
              {i18n.t(bucket.label)}
            </p>
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              {currencyFormat(currency, client.amount_overdue[bucket.key])}
            </p>
          </div>
        ))}
      </div>
    </div>
    <Divider />
  </div>
);

export default ReportMobileRow;
