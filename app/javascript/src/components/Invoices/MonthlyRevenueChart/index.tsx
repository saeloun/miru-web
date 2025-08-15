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
import dayjs from "dayjs";

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  invoiceCount?: number;
}

interface MonthlyRevenueChartProps {
  invoices: any[];
  baseCurrency: string;
  chartType?: "area" | "bar";
  height?: number;
  onChartTypeChange?: (type: "area" | "bar") => void;
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  invoices,
  baseCurrency,
  chartType = "area",
  height = 300,
  onChartTypeChange,
}) => {
  const [chartData, setChartData] = useState<MonthlyRevenueData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRevenue, setAverageRevenue] = useState(0);
  const [trend, setTrend] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    processInvoiceData();
  }, [invoices]);

  const processInvoiceData = () => {
    if (!invoices || invoices.length === 0) {
      setChartData([]);
      setTotalRevenue(0);
      setAverageRevenue(0);
      setTrend(0);
      setIsLoading(false);

      return;
    }

    // Group invoices by month
    const monthlyData: { [key: string]: { revenue: number; count: number } } =
      {};

    // Get last 12 months
    const currentMonth = dayjs();
    const months: string[] = [];

    for (let i = 11; i >= 0; i--) {
      const month = currentMonth.subtract(i, "month");
      const monthKey = month.format("MMM YYYY");
      months.push(monthKey);
      monthlyData[monthKey] = { revenue: 0, count: 0 };
    }

    // Process invoices
    invoices.forEach(invoice => {
      // Include all non-draft statuses for revenue calculation
      if (invoice.status !== "draft") {
        const invoiceDate = dayjs(
          invoice.invoiceDate || invoice.issueDate || invoice.createdAt
        );
        const monthKey = invoiceDate.format("MMM YYYY");

        if (monthlyData[monthKey]) {
          // Handle different amount field names
          const amount = parseFloat(
            invoice.amount || invoice.totalAmount || invoice.total || 0
          );
          monthlyData[monthKey].revenue += amount;
          monthlyData[monthKey].count += 1;
        }
      }
    });

    // Convert to chart format
    const formattedData: MonthlyRevenueData[] = months.map(month => ({
      month: month.split(" ")[0], // Show only month abbreviation
      revenue: monthlyData[month].revenue,
      invoiceCount: monthlyData[month].count,
    }));

    // Calculate statistics
    const total = formattedData.reduce((sum, item) => sum + item.revenue, 0);
    const avg = total / formattedData.length;

    // Calculate trend (compare last month to previous month)
    if (formattedData.length >= 2) {
      const lastMonth = formattedData[formattedData.length - 1].revenue;
      const previousMonth = formattedData[formattedData.length - 2].revenue;
      if (previousMonth > 0) {
        setTrend(((lastMonth - previousMonth) / previousMonth) * 100);
      }
    }

    setChartData(formattedData);
    setTotalRevenue(total);
    setAverageRevenue(avg);
    setIsLoading(false);
  };

  const formatTooltipValue = (value: number) =>
    currencyFormat(baseCurrency, value);

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
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-[#5B34EA] font-semibold">
            {formatTooltipValue(payload[0].value)}
          </p>
          {payload[0].payload.invoiceCount !== undefined && (
            <p className="text-xs text-gray-500">
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
    <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-100">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Revenue
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Revenue trend over the last 12 months
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
          {/* Statistics */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Total
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {currencyFormat(baseCurrency, totalRevenue, "compact")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Average
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {currencyFormat(baseCurrency, averageRevenue, "compact")}
              </p>
            </div>
            {trend !== 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Trend
                </p>
                <p
                  className={`text-lg font-semibold ${
                    trend > 0 ? "text-green-600" : "text-red-600"
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
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-gray-400">No invoice data available</div>
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
                    <stop offset="5%" stopColor="#5B34EA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5B34EA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#5B34EA"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#5B34EA" radius={[8, 8, 0, 0]} />
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
                ? "bg-[#5B34EA] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Area Chart
          </button>
          <button
            onClick={() => onChartTypeChange("bar")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              chartType === "bar"
                ? "bg-[#5B34EA] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Bar Chart
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthlyRevenueChart;
