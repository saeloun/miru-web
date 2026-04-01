import React, { useState, useEffect } from "react";
import { currencyFormat } from "helpers/currency";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendUp, CurrencyDollar } from "phosphor-react";
import { useQuery } from "@tanstack/react-query";
import { i18n } from "../../../i18n";

interface ChartWithSummaryProps {
  summary: {
    overdueAmount: number | string;
    outstandingAmount: number | string;
    draftAmount: number | string;
  };
  baseCurrency: string;
  filterParams: any;
  setFilterParams: (params: any) => void;
}

const ChartWithSummary: React.FC<ChartWithSummaryProps> = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
}) => {
  const [revenueData, setRevenueData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [growthRate, setGrowthRate] = useState(0);
  const [monthlyAvg, setMonthlyAvg] = useState(0);

  // Fetch real invoice data from dashboard API
  const { data: monthlyInvoices } = useQuery({
    queryKey: ["dashboard", "revenue", selectedPeriod],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/v1/dashboard?timeframe=${selectedPeriod}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN":
                document
                  .querySelector('[name="csrf-token"]')
                  ?.getAttribute("content") || "",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          console.warn("Dashboard API error, using fallback data");

          return {
            monthlyData: [],
            growth: 0,
            avg: 0,
            totalRevenue: 0,
          };
        }

        const data = await response.json();
        const revenueChart = data.revenue_chart || [];

        // Transform the data to match our chart format
        const monthlyData = revenueChart.map(item => ({
          month: item.label || item.month || item.name,
          revenue: item.value || item.revenue || item.amount || 0,
          paid: item.paid || item.value || 0,
          pending: item.pending || 0,
        }));

        // Calculate totals and growth
        const totalRevenue = monthlyData.reduce(
          (sum, item) => sum + item.revenue,
          0
        );

        const avg =
          monthlyData.length > 0 ? totalRevenue / monthlyData.length : 0;

        // Calculate growth from stats if available
        const growth = data.stats?.revenue_trend || 0;

        return { monthlyData, growth, avg, totalRevenue };
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        return {
          monthlyData: [],
          growth: 0,
          avg: 0,
          totalRevenue: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (monthlyInvoices) {
      setRevenueData(monthlyInvoices.monthlyData || []);
      setGrowthRate(
        typeof monthlyInvoices.growth === "number" ? monthlyInvoices.growth : 0
      );

      setMonthlyAvg(
        typeof monthlyInvoices.avg === "number" ? monthlyInvoices.avg : 0
      );
    }
  }, [monthlyInvoices]);

  const applyFilter = (status: any) => {
    setFilterParams({
      ...filterParams,
      status,
    });
  };

  const resetFilters = () => {
    setFilterParams({
      ...filterParams,
      status: [],
    });
  };

  // Parse values to ensure they're numbers
  const parseAmount = (value: number | string): number => {
    if (typeof value === "number") return value;
    const parsed = parseFloat(value.toString());

    return isNaN(parsed) ? 0 : parsed;
  };

  const overdueAmount = parseAmount(summary.overdueAmount);
  const outstandingAmount = parseAmount(summary.outstandingAmount);
  const draftAmount = parseAmount(summary.draftAmount);
  const totalAmount = overdueAmount + outstandingAmount + draftAmount;

  const summaryItems = [
    {
      label: i18n.t("all"),
      value: totalAmount,
      colorClass: "text-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: resetFilters,
      isReset: true,
    },
    {
      label: i18n.t("invoices.overdue"),
      value: overdueAmount,
      colorClass: "text-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      label: i18n.t("invoices.outstanding"),
      value: outstandingAmount,
      colorClass: "text-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: "OVERDUE" },
        ]),
    },
    {
      label: i18n.t("invoices.draft"),
      value: draftAmount,
      colorClass: "text-muted-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  const revenueFilters = [
    { label: i18n.t("invoices.monthly"), value: "month", icon: Calendar },
    { label: i18n.t("invoices.quarterly"), value: "quarter", icon: TrendUp },
    { label: i18n.t("invoices.yearly"), value: "year", icon: CurrencyDollar },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm">
          <p className="mb-2 font-semibold text-foreground">{`${label} ${new Date().getFullYear()}`}</p>
          <div className="space-y-1">
            {payload.map((pld, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm text-muted-foreground">
                  {pld.dataKey}:
                </span>
                <span className="text-sm font-bold text-primary">
                  {currencyFormat(baseCurrency, pld.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mb-8 mt-6">
      {/* Main container with chart (70%) and stats (30%) */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Revenue Chart - 70% width */}
        <div className="min-w-0 flex-1 lg:basis-[70%]">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="border-b border-border bg-muted/40 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {i18n.t("invoiceDashboard.revenueOverview")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                                      </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
                    <TrendUp
                      className={`w-4 h-4 ${
                        growthRate > 0
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        growthRate > 0
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {growthRate > 0 ? "+" : ""}
                      {(typeof growthRate === "number"
                        ? growthRate
                        : 0
                      ).toFixed(1)}
                      %
                    </span>
                    <span className="text-xs text-muted-foreground">
                                          </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="invoiceColorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.26}
                        />
                        <stop
                          offset="60%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.12}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="invoiceStrokeRevenue"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                      </linearGradient>
                      <filter
                        id="invoiceShadow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                      >
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="0" dy="4" result="offsetblur" />
                        <feFlood
                          floodColor="hsl(var(--primary))"
                          floodOpacity="0.15"
                        />
                        <feComposite in2="offsetblur" operator="in" />
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="0"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
                      domain={[0, "dataMax + 5000"]}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#invoiceStrokeRevenue)"
                      strokeWidth={2}
                      fill="url(#invoiceColorRevenue)"
                      dot={{
                        fill: "hsl(var(--primary))",
                        strokeWidth: 1,
                        r: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                        fill: "hsl(var(--primary))",
                      }}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Additional Stats Row */}
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <div className="text-center">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("invoiceDashboard.revenueOverview")}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {currencyFormat(baseCurrency, monthlyAvg)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                                      </p>
                  <p className="text-base font-bold text-foreground">
                    {revenueData.reduce(
                      (max, item) => (item.revenue > max.revenue ? item : max),
                      revenueData[0] || { revenue: 0 }
                    )?.month || "-"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("invoices.invoices")}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {revenueData.reduce(
                      (sum, item) => sum + (item.invoices || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards - 30% width, vertical layout */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:basis-[30%] lg:flex-col">
          {summaryItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${item.bgClass} rounded-xl border border-border p-4 text-left transition-all duration-200 hover:shadow-lg lg:flex-1`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className={`text-xl font-bold ${item.colorClass}`}>
                    {currencyFormat(baseCurrency, item.value)}
                  </p>
                </div>
                <svg
                  className="mt-1 h-4 w-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartWithSummary;
