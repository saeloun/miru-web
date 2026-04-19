import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { TrendUp, WarningCircle } from "phosphor-react";

import { analyticsApi } from "apis/api";
import { Paths, Roles } from "../../constants";
import { useUserContext } from "../../context/UserContext";
import { currencyFormat } from "helpers";
import AnalyticsPageLayout from "./components/AnalyticsPageLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

type RevenueForecastPoint = {
  month: string;
  label: string;
  collected_revenue?: number;
  invoiced_revenue?: number;
  forecast_revenue?: number;
};

type RevenueForecastResponse = {
  currency: string;
  horizon: number;
  historical_periods: RevenueForecastPoint[];
  forecast_periods: RevenueForecastPoint[];
};

const HORIZONS = [3, 6, 12] as const;

const chartConfig = {
  collected_revenue: {
    label: "Collected revenue",
    color: "#f97316",
  },
  forecast_revenue: {
    label: "Forecast",
    color: "#155e75",
  },
};

const RevenueForecastLoading = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map(index => (
        <Card key={index} className="border-border">
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-3 h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="border-border">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[320px] w-full" />
      </CardContent>
    </Card>
  </div>
);

const RevenueForecastPage: React.FC = () => {
  const [horizon, setHorizon] = React.useState<number>(6);
  const { companyRole } = useUserContext();
  const isFinancialRole = [
    Roles.ADMIN,
    Roles.OWNER,
    Roles.BOOK_KEEPER,
  ].includes(companyRole as Roles);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["analytics", "revenue-forecast", horizon],
    queryFn: async () => {
      const response = await analyticsApi.getRevenueForecast(horizon);

      return response.data as RevenueForecastResponse;
    },
    enabled: isFinancialRole,
  });

  const historicalPeriods = data?.historical_periods ?? [];
  const forecastPeriods = data?.forecast_periods ?? [];
  const hasData = historicalPeriods.some(
    point => (point.collected_revenue ?? 0) > 0
  );

  const chartData = [
    ...historicalPeriods.map(point => ({
      label: point.label,
      collected_revenue: point.collected_revenue ?? 0,
      forecast_revenue: null,
    })),
    ...forecastPeriods.map(point => ({
      label: point.label,
      collected_revenue: null,
      forecast_revenue: point.forecast_revenue ?? 0,
    })),
  ];

  const recentHistorical = historicalPeriods.slice(
    -Math.min(3, historicalPeriods.length)
  );

  const totalCollected = historicalPeriods.reduce(
    (sum, point) => sum + (point.collected_revenue ?? 0),
    0
  );

  const averageCollected =
    recentHistorical.length > 0
      ? recentHistorical.reduce(
          (sum, point) => sum + (point.collected_revenue ?? 0),
          0
        ) / recentHistorical.length
      : 0;

  const projectedRevenue = forecastPeriods.reduce(
    (sum, point) => sum + (point.forecast_revenue ?? 0),
    0
  );

  return (
    <AnalyticsPageLayout
      title="Revenue Forecast"
      description="Compare recent collections with the next projected months using a moving average forecast."
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div />
        <div className="flex flex-wrap gap-2">
          {HORIZONS.map(option => (
            <Button
              key={option}
              variant={option === horizon ? "default" : "outline"}
              onClick={() => setHorizon(option)}
            >
              {option} months
            </Button>
          ))}
        </div>
      </div>

      {!isFinancialRole && (
        <Alert>
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Financial analytics access is limited</AlertTitle>
          <AlertDescription>
            Employees can access the Analytics section, but revenue forecast
            data is only available to owners, admins, and book keepers.
          </AlertDescription>
        </Alert>
      )}

      {isFinancialRole && (isLoading || isFetching) ? (
        <RevenueForecastLoading />
      ) : null}

      {isFinancialRole && !isLoading && isError ? (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Unable to load revenue forecast</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {(error as Error | undefined)?.message ||
                "The analytics API did not return forecast data."}
            </p>
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {isFinancialRole && !isLoading && !isError && !hasData ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>No revenue history yet</CardTitle>
            <CardDescription>
              Once invoices are paid, Miru will start plotting collected revenue
              and projecting the next months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={Paths.INVOICES.replace("/*", "")}>View invoices</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isFinancialRole && !isLoading && !isError && hasData ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Collected over last 12 months</CardDescription>
                <CardTitle className="text-2xl">
                  {currencyFormat(data?.currency || "USD", totalCollected)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>Average recent month</CardDescription>
                <CardTitle className="text-2xl">
                  {currencyFormat(data?.currency || "USD", averageCollected)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardDescription>
                  Projected next {horizon} months
                </CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <TrendUp size={20} className="text-primary" />
                  {currencyFormat(data?.currency || "USD", projectedRevenue)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Collected revenue and forecast</CardTitle>
              <CardDescription>
                Historical collections are shown first, followed by the
                projected window.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[320px] w-full" config={chartConfig}>
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
                  <YAxis
                    axisLine={false}
                    tickFormatter={value =>
                      currencyFormat(data?.currency || "USD", value, "compact")
                    }
                    tickLine={false}
                    width={90}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          currencyFormat(
                            data?.currency || "USD",
                            Number(value || 0)
                          ),
                          name,
                        ]}
                      />
                    }
                  />
                  <Line
                    dataKey="collected_revenue"
                    dot={false}
                    name="collected_revenue"
                    stroke="var(--color-collected_revenue)"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                  <Line
                    dataKey="forecast_revenue"
                    dot={false}
                    name="forecast_revenue"
                    stroke="var(--color-forecast_revenue)"
                    strokeDasharray="6 6"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </AnalyticsPageLayout>
  );
};

export default RevenueForecastPage;
