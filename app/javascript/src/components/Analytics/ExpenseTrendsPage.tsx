import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { analyticsApi, projectsApi } from "apis/api";
import { Roles } from "../../constants";
import { useUserContext } from "../../context/UserContext";
import AnalyticsPageLayout from "./components/AnalyticsPageLayout";
import AnalyticsFilters from "./components/AnalyticsFilters";
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoading,
} from "./components/AnalyticsStates";
import { useAnalyticsFilters } from "./useAnalyticsFilters";
import { AnalyticsOption, ExpenseTrendsResponse } from "./types";
import {
  buildTrendSeries,
  chartPalette,
  formatCompactCurrency,
  formatStandardCurrency,
  resolveAnalyticsPreset,
} from "./utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { WarningCircle } from "phosphor-react";

const ExpenseTrendsPage: React.FC = () => {
  const { companyRole, company } = useUserContext();
  const {
    dateRange,
    setDateRange,
    preset,
    setPreset,
    selectedIds,
    setSelectedIds,
    from,
    to,
  } = useAnalyticsFilters({ filterKey: "projects" });

  const isFinancialRole = [
    Roles.ADMIN,
    Roles.OWNER,
    Roles.BOOK_KEEPER,
  ].includes(companyRole as Roles);
  const currency = company?.base_currency || "USD";

  const optionsQuery = useQuery({
    queryKey: ["analytics", "project-options"],
    queryFn: async () => {
      const response = await projectsApi.get();
      const projects = response.data?.projects || response.data || [];

      return projects.map(project => ({
        id: Number(project.id),
        label: project.name,
      })) as AnalyticsOption[];
    },
    enabled: isFinancialRole,
  });

  const query = useQuery({
    queryKey: ["analytics", "expenses", from, to, selectedIds],
    queryFn: async () => {
      const response = await analyticsApi.getExpenseTrends({
        from,
        to,
        project_ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
      });

      return response.data as ExpenseTrendsResponse;
    },
    enabled: isFinancialRole,
  });

  const categorySeries = (query.data?.category_trends || []).slice(0, 4);
  const namedSeries = categorySeries.map((trend, index) => ({
    ...trend,
    seriesKey: `series_${index + 1}`,
  }));

  const chartData = buildTrendSeries(
    namedSeries.map(trend => ({
      name: trend.seriesKey,
      monthly_totals: trend.monthly_totals,
    }))
  );

  const chartConfig = categorySeries.reduce(
    (config, trend, index) => ({
      ...config,
      [`series_${index + 1}`]: {
        label: trend.name,
        color: chartPalette[index % chartPalette.length],
      },
    }),
    {} as Record<string, { label: string; color: string }>
  );

  return (
    <AnalyticsPageLayout
      title="Expense Trends"
      description="Track category and project spend over time and surface unusual spikes."
      filters={
        <AnalyticsFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preset={preset}
          onPresetChange={value => {
            setPreset(value);
            setDateRange(resolveAnalyticsPreset(value));
          }}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          options={optionsQuery.data || []}
          multiSelectLabel="Projects"
        />
      }
    >
      {!isFinancialRole ? (
        <Alert>
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Financial analytics access is limited</AlertTitle>
          <AlertDescription>
            Expense trend analytics are available only to owners, admins, and
            book keepers.
          </AlertDescription>
        </Alert>
      ) : null}
      {isFinancialRole && (query.isLoading || optionsQuery.isLoading) ? (
        <AnalyticsLoading rows={4} />
      ) : null}
      {isFinancialRole && !query.isLoading && query.isError ? (
        <AnalyticsErrorState
          title="Unable to load expense trends"
          description="Expense analytics could not be loaded for the selected range."
          onRetry={() => query.refetch()}
        />
      ) : null}
      {isFinancialRole &&
      !query.isLoading &&
      !query.isError &&
      (query.data?.summary.expense_count || 0) === 0 ? (
        <AnalyticsEmptyState
          title="No expenses for this range"
          description="Adjust your project/date filters or add expenses to start tracking trends."
          ctaLabel="View expenses"
          ctaPath="/expenses"
        />
      ) : null}
      {isFinancialRole &&
      !query.isLoading &&
      !query.isError &&
      (query.data?.summary.expense_count || 0) > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Total expenses</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCompactCurrency(
                    currency,
                    query.data?.summary.total_expenses || 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Categories</CardDescription>
                <CardTitle className="text-2xl">
                  {query.data?.summary.category_count}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Projects</CardDescription>
                <CardTitle className="text-2xl">
                  {query.data?.summary.project_count}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Anomalies</CardDescription>
                <CardTitle className="text-2xl">
                  {query.data?.summary.anomaly_count}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {chartData.length > 0 ? (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Category trend chart</CardTitle>
                <CardDescription>
                  Monthly spend across the top visible categories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="h-[320px] w-full"
                  config={chartConfig}
                >
                  <LineChart
                    data={chartData}
                    margin={{ left: 12, right: 12, top: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis axisLine={false} tickLine={false} width={90} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={value => [
                            formatStandardCurrency(
                              currency,
                              Number(value || 0)
                            ),
                            "Amount",
                          ]}
                        />
                      }
                    />
                    {namedSeries.map(trend => (
                      <Line
                        key={trend.seriesKey}
                        dataKey={trend.seriesKey}
                        dot={false}
                        stroke={`var(--color-${trend.seriesKey})`}
                        strokeWidth={2.5}
                        type="monotone"
                      />
                    ))}
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1fr,0.9fr]">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Project trends</CardTitle>
                <CardDescription>
                  Total spend per project in the selected range.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Total amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(query.data?.project_trends || []).map(trend => (
                      <TableRow key={trend.name}>
                        <TableCell className="font-medium">
                          {trend.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatStandardCurrency(currency, trend.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Anomalies</CardTitle>
                <CardDescription>
                  Months that breached the rolling threshold.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(query.data?.anomalies || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No anomalies detected for this range.
                  </p>
                ) : (
                  query.data?.anomalies.map(anomaly => (
                    <div
                      key={`${anomaly.name}-${anomaly.month}`}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="font-medium text-foreground">
                        {anomaly.name}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {anomaly.month} ·{" "}
                        {formatStandardCurrency(currency, anomaly.amount)}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Rolling average{" "}
                        {formatStandardCurrency(
                          currency,
                          anomaly.rolling_average
                        )}{" "}
                        · threshold{" "}
                        {formatStandardCurrency(currency, anomaly.threshold)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </AnalyticsPageLayout>
  );
};

export default ExpenseTrendsPage;
