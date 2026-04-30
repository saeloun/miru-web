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
import { TrendUp } from "phosphor-react";
import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "apis/api";
import { i18n } from "../../../i18n";

interface ChartWithSummaryProps {
  summary: {
    overdueAmount: number | string;
    openAmount?: number | string;
    outstandingAmount: number | string;
    draftAmount: number | string;
  };
  baseCurrency: string;
  filterParams: any;
  setFilterParams: (params: any) => void;
  statusCounts?: {
    all?: number;
    overdue?: number;
    outstanding?: number;
    draft?: number;
  };
}

const ChartWithSummary: React.FC<ChartWithSummaryProps> = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
  statusCounts,
}) => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [selectedPeriod] = useState("year");
  const [growthRate, setGrowthRate] = useState(0);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);
  const [currentMonthInvoices, setCurrentMonthInvoices] = useState(0);
  const [currentMonthLabel, setCurrentMonthLabel] = useState("-");

  const formatFullMonthLabel = (value: unknown, fallback?: string): string => {
    if (typeof value === "string" && value.trim()) return value.trim();

    if (fallback) return fallback;

    return "-";
  };

  const formatXAxisTick = (value: string) => {
    const match = value.match(/^([A-Za-z]{3,})\s+(\d{4})$/);

    if (!match) return value;

    return `${match[1]} '${match[2].slice(-2)}`;
  };

  const parseNumber = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;

    if (typeof value === "string") {
      const normalized = value.trim();
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;

      const noSeparators = normalized.replace(/,/g, "");
      const parsedNoSeparators = Number(noSeparators);
      if (Number.isFinite(parsedNoSeparators)) return parsedNoSeparators;

      return 0;
    }

    return 0;
  };

  const periodMonths =
    selectedPeriod === "month" ? 1 : selectedPeriod === "quarter" ? 3 : 12;

  const { data: monthlyInvoices } = useQuery({
    queryKey: ["invoices", "analytics", "monthly_revenue", selectedPeriod],
    queryFn: async () => {
      const response = await invoicesApi.getMonthlyRevenue();
      const data = response?.data || {};
      const rawChartData = Array.isArray(data.chart_data)
        ? data.chart_data
        : [];
      const scopedData = rawChartData.slice(-periodMonths);
      const statistics = data.statistics || {};
      const latestPoint = scopedData[scopedData.length - 1];

      const monthlyData = scopedData.map(item => ({
        month: item.month || item.label || item.name,
        fullMonth: formatFullMonthLabel(
          item.full_month ?? item.fullMonth,
          [item.month || item.label || item.name, item.year]
            .filter(Boolean)
            .join(" ")
            .trim()
        ),
        revenue: parseNumber(
          item.monthly_revenue ?? item.revenue ?? item.value ?? item.amount
        ),
        invoices: parseNumber(
          item.invoices ?? item.invoice_count ?? item.count
        ),
      }));

      const computedGrowth =
        monthlyData.length >= 2
          ? (() => {
              const last = monthlyData[monthlyData.length - 1].revenue;
              const previous = monthlyData[monthlyData.length - 2].revenue;

              return previous > 0 ? ((last - previous) / previous) * 100 : 0;
            })()
          : 0;

      const apiTrend = parseNumber(statistics.trend);
      const latestMonthlyPoint = monthlyData[monthlyData.length - 1];

      return {
        monthlyData,
        growth: selectedPeriod === "year" ? apiTrend : computedGrowth,
        currentMonthRevenue: parseNumber(
          statistics.current_month_revenue ?? latestPoint?.revenue ?? 0
        ),
        currentMonthInvoices: parseNumber(
          statistics.current_month_invoices ?? latestPoint?.invoice_count ?? 0
        ),
        currentMonthLabel:
          latestMonthlyPoint?.fullMonth ||
          latestMonthlyPoint?.month ||
          latestMonthlyPoint?.label ||
          latestMonthlyPoint?.name ||
          data?.period?.end_date?.split(" ")?.[0] ||
          "-",
      };
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

      setCurrentMonthRevenue(
        typeof monthlyInvoices.currentMonthRevenue === "number"
          ? monthlyInvoices.currentMonthRevenue
          : 0
      );

      setCurrentMonthInvoices(
        typeof monthlyInvoices.currentMonthInvoices === "number"
          ? monthlyInvoices.currentMonthInvoices
          : 0
      );
      setCurrentMonthLabel(monthlyInvoices.currentMonthLabel || "-");
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
  const providedOpenAmount = parseAmount(summary.openAmount ?? 0);
  const draftAmount = parseAmount(summary.draftAmount);
  const openAmount =
    summary.openAmount !== undefined
      ? providedOpenAmount
      : Math.max(outstandingAmount - overdueAmount, 0);
  const totalAmount = overdueAmount + openAmount + draftAmount;

  const summaryItems = [
    {
      label: i18n.t("invoices.unpaid"),
      value: totalAmount,
      count: statusCounts?.all ?? 0,
      colorClass: "text-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: resetFilters,
    },
    {
      label: i18n.t("invoices.overdue"),
      value: overdueAmount,
      count: statusCounts?.overdue ?? 0,
      colorClass: "text-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      label: i18n.t("invoices.outstanding"),
      value: openAmount,
      count: statusCounts?.outstanding ?? 0,
      colorClass: "text-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
        ]),
    },
    {
      label: i18n.t("invoices.draft"),
      value: draftAmount,
      count: statusCounts?.draft ?? 0,
      colorClass: "text-muted-foreground",
      bgClass: "bg-muted/40 hover:bg-accent",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm">
          <p className="mb-2 font-semibold text-foreground">{label}</p>
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
                  <p className="mt-1 text-sm text-muted-foreground"></p>
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
                    {revenueData.length >= 2 ? (
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
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {i18n.t("invoices.noData")}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground"></span>
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
                      dataKey="fullMonth"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      tickFormatter={formatXAxisTick}
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
                    {i18n.t("thisMonth")}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {currencyFormat(baseCurrency, currentMonthRevenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("month")}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {currentMonthLabel}
                  </p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {i18n.t("invoices.invoices")}
                  </p>
                  <p className="text-base font-bold text-foreground">
                    {Math.round(currentMonthInvoices)}
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(item.count || 0)} {i18n.t("invoices.invoices")}
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
