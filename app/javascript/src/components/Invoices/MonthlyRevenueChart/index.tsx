import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { currencyFormat } from "helpers";
import { Toastr } from "StyledComponents";
import { i18n } from "../../../i18n";

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  invoiceCount?: number;
}

interface MonthlyRevenueChartProps {
  baseCurrency: string;
  chartType?: "area" | "bar";
  height?: number;
  onChartTypeChange?: (type: "area" | "bar") => void;
  monthlyData?: MonthlyRevenueData[];
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  baseCurrency,
  chartType = "area",
  height = 300,
  onChartTypeChange,
  monthlyData,
}) => {
  const [chartData, setChartData] = useState<MonthlyRevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRevenue, setAverageRevenue] = useState(0);
  const [trend, setTrend] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState(baseCurrency);

  useEffect(() => {
    if (monthlyData) {
      processMonthlyData(monthlyData);
    } else {
      generateMockData();
    }
  }, [monthlyData]);

  const generateMockData = () => {
    // Generate mock data for the last 12 months
    const months = [
      i18n.t("monthJan"),
      i18n.t("monthFeb"),
      i18n.t("monthMar"),
      i18n.t("monthApr"),
      i18n.t("monthMay"),
      i18n.t("monthJun"),
      i18n.t("monthJul"),
      i18n.t("monthAug"),
      i18n.t("monthSep"),
      i18n.t("monthOct"),
      i18n.t("monthNov"),
      i18n.t("monthDec"),
    ];
    const currentMonth = new Date().getMonth();
    const mockData: MonthlyRevenueData[] = [];

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      mockData.push({
        month: months[monthIndex],
        revenue: 0,
        invoiceCount: 0,
      });
    }

    processMonthlyData(mockData);
  };

  const processMonthlyData = (inputData: MonthlyRevenueData[]) => {
    try {
      setIsLoading(false);

      // Set the chart data
      const formattedData: MonthlyRevenueData[] = inputData.map(item => ({
        month: item.month,
        revenue: item.revenue,
        invoiceCount: item.invoiceCount || item.invoice_count,
      }));

      setChartData(formattedData);

      // Calculate statistics from the data
      const total = formattedData.reduce((sum, item) => sum + item.revenue, 0);
      const avg = formattedData.length > 0 ? total / formattedData.length : 0;

      setTotalRevenue(total);
      setAverageRevenue(avg);
      setTrend(0); // Trend calculation would require historical data
      setCurrency(baseCurrency);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      Toastr.error(i18n.t("invoices.failedToLoadRevenueData"));
      setChartData([]);
      setIsLoading(false);
    }
  };

  const formatTooltipValue = (value: number) => currencyFormat(currency, value);

  const formatYAxisTick = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }

    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm font-semibold text-primary">
            {formatTooltipValue(payload[0].value)}
          </p>
          {payload[0].payload.invoiceCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.invoiceCount} invoice
              {payload[0].payload.invoiceCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {i18n.t("invoiceDashboard.revenueOverview")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
          {/* Statistics */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {i18n.t("total")}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {currencyFormat(currency, totalRevenue, "compact")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {i18n.t("invoiceDashboard.revenueOverview")}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {currencyFormat(currency, averageRevenue, "compact")}
              </p>
            </div>
            {trend !== 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {i18n.t("invoices.trend")}
                </p>
                <p
                  className={`text-lg font-semibold ${
                    trend > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {isLoading ? (
        <div
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-muted-foreground">{i18n.t("invoices.loadingChartData")}</div>
        </div>
      ) : chartData.length === 0 ? (
        <div
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-muted-foreground">{i18n.t("invoices.noInvoiceData")}</div>
        </div>
      ) : (
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary) / 0.72)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Type Toggle */}
      {onChartTypeChange && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => onChartTypeChange("area")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              chartType === "area"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {i18n.t("invoiceDashboard.revenueOverview")}
          </button>
          <button
            onClick={() => onChartTypeChange("bar")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              chartType === "bar"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {i18n.t("invoiceDashboard.revenueOverview")}
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthlyRevenueChart;
