import React from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { TrendUp, TrendDown, Minus } from "phosphor-react";

import { analyticsApi } from "apis/api";
import { Roles } from "../../../constants";
import { useUserContext } from "../../../context/UserContext";
import { currencyFormat } from "../../../helpers/currency";
import { i18n } from "../../../i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";

type ClientAnalyticsSummaryProps = {
  clientId?: string | number;
};

type ClientAnalyticsResponse = {
  clients: Array<{
    client_id: number;
    client_name: string;
    total_revenue: number;
    average_invoice_amount: number;
    payment_cycle_days: number;
    payment_frequency_days: number;
    trend_direction: string;
  }>;
};

const trendIconMap = {
  up: TrendUp,
  down: TrendDown,
  flat: Minus,
} as const;

const ClientAnalyticsSummary: React.FC<ClientAnalyticsSummaryProps> = ({
  clientId,
}) => {
  const { company, companyRole } = useUserContext();
  const canViewClientAnalytics = [
    Roles.ADMIN,
    Roles.OWNER,
    Roles.MANAGER,
    Roles.BOOK_KEEPER,
  ].includes(companyRole as Roles);
  const currency = company?.base_currency || company?.baseCurrency || "USD";
  const from = subDays(new Date(), 365).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const query = useQuery({
    queryKey: ["invoice-client-analytics", clientId],
    queryFn: async () => {
      const response = await analyticsApi.getClientAnalysis({
        from,
        to,
        client_ids: clientId,
        track_view: false,
      });

      return response.data as ClientAnalyticsResponse;
    },
    enabled: canViewClientAnalytics && Boolean(clientId),
  });

  if (!canViewClientAnalytics || !clientId) return null;

  if (query.isLoading) {
    return (
      <Card className="mb-8 border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Client analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const client = query.data?.clients?.[0];

  if (query.isError || !client) {
    return (
      <Card className="mb-8 border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Client analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {i18n.t("reports.noResults")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    trendIconMap[
      (client.trend_direction as keyof typeof trendIconMap) || "flat"
    ] || Minus;

  return (
    <Card className="mb-8 border-border bg-muted/20">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Client analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <p className="text-xs text-muted-foreground">Total revenue</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {currencyFormat(currency, client.total_revenue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Average invoice</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {currencyFormat(currency, client.average_invoice_amount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payment cycle</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {client.payment_cycle_days.toFixed(2)} days
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Payment frequency</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {client.payment_frequency_days.toFixed(2)} days
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recent trend</p>
          <div className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
            <TrendIcon className="h-4 w-4" />
            <span className="capitalize">{client.trend_direction}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientAnalyticsSummary;
