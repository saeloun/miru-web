import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { analyticsApi, teamApi } from "apis/api";
import { unmapList } from "mapper/mappedIndex";
import { Roles } from "../../constants";
import { useUserContext } from "../../context/UserContext";
import { useIsMobile } from "../../hooks/use-mobile";
import AnalyticsPageLayout from "./components/AnalyticsPageLayout";
import AnalyticsFilters from "./components/AnalyticsFilters";
import AnalyticsExportActions from "./components/AnalyticsExportActions";
import AnalyticsSavedReports from "./components/AnalyticsSavedReports";
import {
  AnalyticsEmptyState,
  AnalyticsErrorState,
  AnalyticsLoading,
} from "./components/AnalyticsStates";
import { useAnalyticsFilters } from "./useAnalyticsFilters";
import { AnalyticsOption, TeamProductivityResponse } from "./types";
import {
  formatPercent,
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

const chartConfig = {
  billable_hours: { label: "Billable hours", color: "#0f766e" },
  non_billable_hours: { label: "Non-billable hours", color: "#f97316" },
};

const TeamAnalyticsPage: React.FC = () => {
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
  } = useAnalyticsFilters({ filterKey: "members" });
  const isEmployee = companyRole === Roles.EMPLOYEE;
  const isManager = companyRole === Roles.MANAGER;
  const canFilterMembers = !isEmployee && !isManager;
  const effectiveSelectedIds = canFilterMembers ? selectedIds : [];
  const currency = company?.base_currency || "USD";

  const optionsQuery = useQuery({
    queryKey: ["analytics", "team-options"],
    queryFn: async () => {
      const response = await teamApi.get("page=1&items=1000");

      return unmapList(response).map(member => ({
        id: Number(member.id),
        label: member.name,
      })) as AnalyticsOption[];
    },
    enabled: canFilterMembers,
  });

  const query = useQuery({
    queryKey: ["analytics", "team", from, to, effectiveSelectedIds],
    queryFn: async () => {
      const response = await analyticsApi.getTeamProductivity({
        from,
        to,
        view_context: "team_productivity",
        user_ids:
          effectiveSelectedIds.length > 0
            ? effectiveSelectedIds.join(",")
            : undefined,
      });

      return response.data as TeamProductivityResponse;
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const members = query.data?.members || [];
  const chartData = members.slice(0, isMobile ? 5 : 8).map(member => ({
    name: member.user_name,
    billable_hours: member.billable_hours,
    non_billable_hours: member.non_billable_hours,
  }));

  const exportMutation = useMutation({
    mutationFn: async (format: "csv" | "pdf") => {
      const response = await analyticsApi.downloadExport(
        "team_productivity",
        format,
        {
          from,
          to,
          user_ids:
            effectiveSelectedIds.length > 0
              ? effectiveSelectedIds.join(",")
              : undefined,
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `team_analytics_${new Date()
        .toISOString()
        .slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  return (
    <AnalyticsPageLayout
      title="Team Analytics"
      description="Track utilization, billable contribution, and realized hourly value across your team."
      actions={
        <AnalyticsExportActions
          isExporting={exportMutation.isPending}
          onExport={format => exportMutation.mutate(format)}
        />
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
          selectedIds={effectiveSelectedIds}
          onSelectedIdsChange={canFilterMembers ? setSelectedIds : undefined}
          options={canFilterMembers ? optionsQuery.data || [] : []}
          multiSelectLabel={canFilterMembers ? "Team members" : undefined}
        />
      }
    >
      {query.isLoading || optionsQuery.isLoading ? (
        <AnalyticsLoading rows={5} />
      ) : null}
      {!query.isLoading && query.isError ? (
        <AnalyticsErrorState
          title="Unable to load team analytics"
          description="Team performance data could not be loaded for the selected range."
          onRetry={() => query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.isError && members.length === 0 ? (
        <AnalyticsEmptyState
          title="No team activity for this range"
          description="Adjust the date range or member filter once time entries are available."
          ctaLabel="View time tracking"
          ctaPath="/time-tracking"
        />
      ) : null}
      {!query.isLoading && !query.isError && members.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Team size</CardDescription>
                <CardTitle className="text-2xl">
                  {query.data?.summary.team_size}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Total hours</CardDescription>
                <CardTitle className="text-2xl">
                  {query.data?.summary.total_hours.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Billable hours</CardDescription>
                <CardTitle className="text-2xl">
                  {query.data?.summary.billable_hours.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Utilization</CardDescription>
                <CardTitle className="text-2xl">
                  {formatPercent(query.data?.summary.utilization_rate)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Average hourly rate</CardDescription>
                <CardTitle className="text-2xl">
                  {formatStandardCurrency(
                    currency,
                    query.data?.summary.average_hourly_rate || 0
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {chartData.length > 0 ? (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Billable vs non-billable hours</CardTitle>
                <CardDescription>
                  The top visible team members in the selected range.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  className="h-[320px] w-full"
                  config={chartConfig}
                >
                  <BarChart
                    data={chartData}
                    margin={{ left: 12, right: 12, top: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="name"
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="billable_hours"
                      fill="var(--color-billable_hours)"
                      radius={[4, 4, 0, 0]}
                    />
                    {!isMobile ? (
                      <Bar
                        dataKey="non_billable_hours"
                        fill="var(--color-non_billable_hours)"
                        radius={[4, 4, 0, 0]}
                      />
                    ) : null}
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Team members</CardTitle>
              <CardDescription>
                Member-level utilization and realized value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Total hours</TableHead>
                    <TableHead className="text-right">Billable</TableHead>
                    <TableHead className="text-right">Non-billable</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead className="text-right">
                      Avg hourly rate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.user_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.total_hours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.billable_hours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.non_billable_hours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(member.utilization_rate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatStandardCurrency(
                          currency,
                          member.average_hourly_rate
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <AnalyticsSavedReports
            reportType="team_productivity"
            filters={{
              preset,
              from,
              to,
              ...(canFilterMembers && effectiveSelectedIds.length > 0
                ? { members: effectiveSelectedIds.join(",") }
                : {}),
            }}
            allowSave={true}
          />
        </>
      ) : null}
    </AnalyticsPageLayout>
  );
};

export default TeamAnalyticsPage;
