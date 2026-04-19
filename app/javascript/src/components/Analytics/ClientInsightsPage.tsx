import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { analyticsApi, clientsApi } from "apis/api";
import { unmapClientList } from "mapper/mappedIndex";
import { Roles } from "../../constants";
import { useUserContext } from "../../context/UserContext";
import { useIsMobile } from "../../hooks/use-mobile";
import AnalyticsPageLayout from "./components/AnalyticsPageLayout";
import AnalyticsFilters from "./components/AnalyticsFilters";
import AnalyticsExportActions from "./components/AnalyticsExportActions";
import AnalyticsSavedReports from "./components/AnalyticsSavedReports";
import ClientRevenueHeatmap from "./components/ClientRevenueHeatmap";
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoading,
  AnalyticsRestrictedState,
} from "./components/AnalyticsStates";
import { useAnalyticsFilters } from "./useAnalyticsFilters";
import { AnalyticsOption, ClientAnalysisResponse } from "./types";
import {
  formatCompactCurrency,
  formatStandardCurrency,
  getTrendText,
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

const chartConfig = {
  revenue: { label: "Revenue", color: "#2563eb" },
};

const ClientInsightsPage: React.FC = () => {
  const { companyRole, company } = useUserContext();
  const isMobile = useIsMobile();
  const {
    dateRange,
    setDateRange,
    preset,
    setPreset,
    selectedIds,
    setSelectedIds,
    from,
    to,
  } = useAnalyticsFilters({ filterKey: "clients" });

  const isFinancialRole = [
    Roles.ADMIN,
    Roles.OWNER,
    Roles.MANAGER,
    Roles.BOOK_KEEPER,
  ].includes(companyRole as Roles);
  const currency = company?.base_currency || "USD";

  const optionsQuery = useQuery({
    queryKey: ["analytics", "client-options"],
    queryFn: async () => {
      const response = await clientsApi.get("?time_frame=month");

      return unmapClientList({ data: response.data }).clientList.map(
        client => ({
          id: Number(client.id),
          label: client.name,
        })
      ) as AnalyticsOption[];
    },
    enabled: isFinancialRole && companyRole !== Roles.MANAGER,
  });

  const query = useQuery({
    queryKey: ["analytics", "clients", from, to, selectedIds],
    queryFn: async () => {
      const response = await analyticsApi.getClientAnalysis({
        from,
        to,
        view_context: "client_analysis",
        client_ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
      });

      return response.data as ClientAnalysisResponse;
    },
    enabled: isFinancialRole,
  });

  const clients = query.data?.clients || [];
  const topClient = query.data?.top_clients[0];

  const exportMutation = useMutation({
    mutationFn: async (format: "csv" | "pdf") => {
      const response = await analyticsApi.downloadExport(
        "client_analysis",
        format,
        {
          from,
          to,
          client_ids: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `client_insights_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  return (
    <AnalyticsPageLayout
      title="Client Insights"
      description="Understand which clients contribute the most revenue and how fast they pay."
      actions={
        isFinancialRole ? (
          <AnalyticsExportActions
            isExporting={exportMutation.isPending}
            onExport={format => exportMutation.mutate(format)}
          />
        ) : null
      }
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
          onSelectedIdsChange={companyRole === Roles.MANAGER ? undefined : setSelectedIds}
          options={companyRole === Roles.MANAGER ? [] : optionsQuery.data || []}
          multiSelectLabel={companyRole === Roles.MANAGER ? undefined : "Clients"}
        />
      }
    >
      {!isFinancialRole ? (
        <div className="space-y-4">
          <Alert>
            <WarningCircle className="h-4 w-4" />
            <AlertTitle>Financial analytics access is limited</AlertTitle>
            <AlertDescription>
              Client revenue analytics are available only to owners, admins, and
              book keepers.
            </AlertDescription>
          </Alert>
          <AnalyticsRestrictedState
            title="Client insights are restricted"
            description="This page summarizes invoices, collections, and payment timing across the workspace."
          />
        </div>
      ) : null}
      {isFinancialRole && (query.isLoading || optionsQuery.isLoading) ? (
        <AnalyticsLoading rows={5} />
      ) : null}
      {isFinancialRole && !query.isLoading && query.isError ? (
        <AnalyticsErrorState
          title="Unable to load client insights"
          description="Client analytics could not be loaded for the selected range."
          onRetry={() => query.refetch()}
        />
      ) : null}
      {isFinancialRole &&
      !query.isLoading &&
      !query.isError &&
      clients.length === 0 ? (
        <AnalyticsEmptyState
          title="No client analytics for this range"
          description="Adjust the filters or wait until invoices and payments are available."
          ctaLabel="View clients"
          ctaPath="/clients"
        />
      ) : null}
      {isFinancialRole &&
      !query.isLoading &&
      !query.isError &&
      clients.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Total revenue</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCompactCurrency(
                    currency,
                    query.data?.summary.total_revenue || 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Collected revenue</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCompactCurrency(
                    currency,
                    query.data?.summary.total_collected_revenue || 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Avg invoice amount</CardDescription>
                <CardTitle className="text-2xl">
                  {formatStandardCurrency(
                    currency,
                    query.data?.summary.average_invoice_amount || 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Avg payment frequency</CardDescription>
                <CardTitle className="text-2xl">
                  {(
                    query.data?.summary.average_payment_frequency_days || 0
                  ).toFixed(2)}
                  d
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Avg payment cycle</CardDescription>
                <CardTitle className="text-2xl">
                  {(
                    query.data?.summary.average_payment_cycle_days || 0
                  ).toFixed(2)}
                  d
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Client table</CardTitle>
                <CardDescription>
                  Revenue, collections, and payment behavior by client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Avg invoice</TableHead>
                      <TableHead className="text-right">Frequency</TableHead>
                      <TableHead className="text-right">Cycle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map(client => (
                      <TableRow key={client.client_id}>
                        <TableCell className="font-medium">
                          {client.client_name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatStandardCurrency(
                            currency,
                            client.total_revenue
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatStandardCurrency(
                            currency,
                            client.collected_revenue
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatStandardCurrency(
                            currency,
                            client.average_invoice_amount
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {client.payment_frequency_days.toFixed(2)}d
                        </TableCell>
                        <TableCell className="text-right">
                          {client.payment_cycle_days.toFixed(2)}d
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Top clients</CardTitle>
                  <CardDescription>
                    Highest revenue contributors in this range.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(query.data?.top_clients || []).slice(0, 5).map(client => (
                    <div
                      key={client.client_id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="font-medium text-foreground">
                        {client.client_name}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCompactCurrency(currency, client.total_revenue)}{" "}
                        · {getTrendText(client.trend_direction)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {topClient ? (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>{topClient.client_name} trend</CardTitle>
                    <CardDescription>
                      Monthly revenue trend for the top client.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      className="h-[260px] w-full"
                      config={chartConfig}
                    >
                      <LineChart
                        data={isMobile ? topClient.monthly_trend.slice(-6) : topClient.monthly_trend}
                        margin={{ left: 12, right: 12, top: 8 }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          axisLine={false}
                          dataKey="label"
                          tickFormatter={value => (isMobile ? String(value).split(" ")[0] : value)}
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
                                "Revenue",
                              ]}
                            />
                          }
                        />
                        <Line
                          dataKey="revenue"
                          dot={false}
                          stroke="var(--color-revenue)"
                          strokeWidth={2.5}
                          type="monotone"
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <ClientRevenueHeatmap clients={clients} isMobile={isMobile} />

          <AnalyticsSavedReports
            reportType="client_analysis"
            filters={{
              preset,
              from,
              to,
              clients: selectedIds.length > 0 ? selectedIds.join(",") : undefined,
            }}
            allowSave={isFinancialRole}
          />
        </>
      ) : null}
    </AnalyticsPageLayout>
  );
};

export default ClientInsightsPage;
