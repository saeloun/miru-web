import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

import { currencyFormat } from "../../helpers/currency";

interface RevenueChartProps {
  data: any[];
  timeframe: string;
  onTimeframeChange: (value: string) => void;
  baseCurrency: string;
  loading?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  invoices: {
    label: "Invoices",
    color: "hsl(var(--chart-2))",
  },
};

const customerChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
};

export const RevenueAreaChart: React.FC<RevenueChartProps> = ({
  data,
  timeframe,
  onTimeframeChange,
  baseCurrency,
  loading,
}) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
    <CardHeader className="border-b border-gray-100 pb-6 bg-white/70 backdrop-blur-sm">
      <div className="grid flex-1 gap-2">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          Financial Performance
        </p>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Annual Revenue
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 font-medium">
          Monthly revenue breakdown for the past 12 months
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="px-2 pt-6 pb-2 sm:px-6">
      {loading ? (
        <div className="flex items-center justify-center h-[320px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[320px] w-full"
        >
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="strokeRevenue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feFlood floodColor="#6366f1" floodOpacity="0.15" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#e5e7eb"
              strokeDasharray="0"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
              tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
              domain={[0, "dataMax + 5000"]}
            />
            <ChartTooltip
              cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={value => `${value} 2024`}
                  formatter={(value: any) =>
                    currencyFormat(baseCurrency, value)
                  }
                  className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-lg"
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#colorRevenue)"
              stroke="url(#strokeRevenue)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: "#ffffff",
                fill: "#6366f1",
                filter: "url(#shadow)",
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </CardContent>
  </Card>
);

interface CustomerRevenueChartProps {
  data: any[];
  timeframe: string;
  baseCurrency: string;
  loading?: boolean;
}

export const CustomerRevenueChart: React.FC<CustomerRevenueChartProps> = ({
  data,
  timeframe,
  baseCurrency,
  loading,
}) => {
  const getGradientColor = (index: number) => {
    const colors = [
      "from-violet-500 to-purple-500",
      "from-blue-500 to-indigo-500",
      "from-cyan-500 to-teal-500",
      "from-emerald-500 to-green-500",
      "from-amber-500 to-orange-500",
    ];

    return colors[index % colors.length];
  };

  return (
    <Card className="border-0 shadow-lg h-full hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="border-b border-gray-100 pb-6 bg-white/70 backdrop-blur-sm">
        <div className="grid flex-1 gap-2">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
            Customer Analysis
          </p>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Top Performers
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 font-medium">
            Highest revenue generating customers
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            {data.slice(0, 5).map((customer, index) => (
              <div
                key={index}
                className="space-y-2 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px] group-hover:text-indigo-600 transition-colors">
                    {customer.name}
                  </span>
                  <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tabular-nums">
                    ${(customer.revenue / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      {customer.percentage}% of total
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getGradientColor(
                        index
                      )} transition-all duration-700 ease-out relative overflow-hidden`}
                      style={{
                        width: `${customer.percentage}%`,
                        animation: "slideIn 1s ease-out",
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <style jsx>{`
              @keyframes slideIn {
                from {
                  width: 0;
                }
              }
            `}</style>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-3">📊</div>
            No revenue data available for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};
