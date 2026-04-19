import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { WarningCircle } from "phosphor-react";

import { analyticsApi } from "apis/api";
import { Paths, Roles } from "../../constants";
import { useUserContext } from "../../context/UserContext";
import AnalyticsPageLayout from "./components/AnalyticsPageLayout";
import AnalyticsFilters from "./components/AnalyticsFilters";
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoading,
} from "./components/AnalyticsStates";
import { useAnalyticsFilters } from "./useAnalyticsFilters";
import {
  ComparisonResponse,
  ExpenseTrendsResponse,
  TeamProductivityResponse,
  ClientAnalysisResponse,
} from "./types";
import {
  resolveAnalyticsPreset,
  formatCompactCurrency,
  formatPercent,
  formatStandardCurrency,
} from "./utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";

const analyticsViews = [
  {
    title: "Revenue Forecast",
    description: "Project collections for the next 3, 6, or 12 months.",
    href: `${Paths.ANALYTICS}/revenue-forecast`,
  },
  {
    title: "Team Analytics",
    description:
      "Track billable effort, utilization, and effective hourly rate.",
    href: `${Paths.ANALYTICS}/team`,
  },
  {
    title: "Client Insights",
    description: "Review top clients, collection behavior, and revenue trends.",
    href: `${Paths.ANALYTICS}/clients`,
  },
  {
    title: "Expense Trends",
    description: "Monitor category and project spend with anomaly flags.",
    href: `${Paths.ANALYTICS}/expenses`,
  },
];

const AnalyticsHome: React.FC = () => {
  const { companyRole, company } = useUserContext();
  const { dateRange, setDateRange, preset, setPreset, from, to } =
    useAnalyticsFilters();

  const isFinancialRole = [
    Roles.ADMIN,
    Roles.OWNER,
    Roles.BOOK_KEEPER,
  ].includes(companyRole as Roles);
  const currency = company?.base_currency || "USD";

  const comparisonQuery = useQuery({
    queryKey: ["analytics", "dashboard", "comparison", from, to],
    queryFn: async () => {
      const response = await analyticsApi.getComparison({ from, to });

      return response.data as ComparisonResponse;
    },
    enabled: isFinancialRole,
  });

  const teamQuery = useQuery({
    queryKey: ["analytics", "dashboard", "team", from, to],
    queryFn: async () => {
      const response = await analyticsApi.getTeamProductivity({ from, to });

      return response.data as TeamProductivityResponse;
    },
  });

  const clientQuery = useQuery({
    queryKey: ["analytics", "dashboard", "clients", from, to],
    queryFn: async () => {
      const response = await analyticsApi.getClientAnalysis({ from, to });

      return response.data as ClientAnalysisResponse;
    },
    enabled: isFinancialRole,
  });

  const expenseQuery = useQuery({
    queryKey: ["analytics", "dashboard", "expenses", from, to],
    queryFn: async () => {
      const response = await analyticsApi.getExpenseTrends({ from, to });

      return response.data as ExpenseTrendsResponse;
    },
    enabled: isFinancialRole,
  });

  const isLoading =
    comparisonQuery.isLoading ||
    teamQuery.isLoading ||
    clientQuery.isLoading ||
    expenseQuery.isLoading;

  const hasError =
    comparisonQuery.isError ||
    teamQuery.isError ||
    clientQuery.isError ||
    expenseQuery.isError;

  return (
    <AnalyticsPageLayout
      title="Analytics"
      description="A single workspace for predictive finance, client behavior, and team performance."
      filters={
        <AnalyticsFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preset={preset}
          onPresetChange={value => {
            setPreset(value);
            setDateRange(resolveAnalyticsPreset(value));
          }}
        />
      }
    >
      {!isFinancialRole ? (
        <Alert>
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Some analytics are limited</AlertTitle>
          <AlertDescription>
            Employees can access team analytics, but financial analytics remain
            available only to owners, admins, and book keepers.
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? <AnalyticsLoading rows={4} /> : null}

      {!isLoading && hasError ? (
        <AnalyticsErrorState
          title="Unable to load analytics dashboard"
          description="One or more analytics endpoints did not respond. Retry after the data refreshes."
          onRetry={() => {
            comparisonQuery.refetch();
            teamQuery.refetch();
            clientQuery.refetch();
            expenseQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && !hasError && !teamQuery.data ? (
        <AnalyticsEmptyState
          title="No analytics data yet"
          description="Start logging time, issuing invoices, and recording expenses to populate the analytics workspace."
        />
      ) : null}

      {!isLoading && !hasError && teamQuery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Team utilization</CardDescription>
                <CardTitle className="text-2xl">
                  {formatPercent(teamQuery.data.summary.utilization_rate)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Billable hours</CardDescription>
                <CardTitle className="text-2xl">
                  {teamQuery.data.summary.billable_hours.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Total revenue</CardDescription>
                <CardTitle className="text-2xl">
                  {formatStandardCurrency(
                    comparisonQuery.data?.metrics.invoiced_revenue
                      ? "USD"
                      : "USD",
                    clientQuery.data?.summary.total_revenue || 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Anomalies</CardDescription>
                <CardTitle className="text-2xl">
                  {expenseQuery.data?.summary.anomaly_count || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Analytics views</CardTitle>
                <CardDescription>
                  Navigate directly to the focused report you need.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {analyticsViews.map(view => (
                  <Card key={view.href} className="border-border bg-muted/20">
                    <CardHeader>
                      <CardTitle className="text-base">{view.title}</CardTitle>
                      <CardDescription>{view.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline">
                        <Link to={view.href}>Open</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
                <CardDescription>
                  Quick takeaways from the selected period.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">
                    Current vs previous revenue
                  </div>
                  <div className="mt-1 text-xl font-semibold text-foreground">
                    {comparisonQuery.data
                      ? `${formatStandardCurrency(
                          currency,
                          comparisonQuery.data.metrics.collected_revenue.current
                        )} (${comparisonQuery.data.metrics.collected_revenue.change_percentage.toFixed(
                          2
                        )}%)`
                      : "Unavailable"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">
                    Top client
                  </div>
                  <div className="mt-1 text-xl font-semibold text-foreground">
                    {clientQuery.data?.top_clients[0]
                      ? `${
                          clientQuery.data.top_clients[0].client_name
                        } · ${formatCompactCurrency(
                          currency,
                          clientQuery.data.top_clients[0].total_revenue
                        )}`
                      : "No client history"}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">
                    Average hourly rate
                  </div>
                  <div className="mt-1 text-xl font-semibold text-foreground">
                    {formatStandardCurrency(
                      currency,
                      teamQuery.data.summary.average_hourly_rate
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </AnalyticsPageLayout>
  );
};

export default AnalyticsHome;
