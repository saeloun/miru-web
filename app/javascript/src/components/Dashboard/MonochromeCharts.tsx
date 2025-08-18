import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
}) => {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-200 pb-6">
        <div className="grid flex-1 gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial Performance</p>
          <CardTitle className="text-2xl font-bold text-gray-900">Annual Revenue</CardTitle>
          <CardDescription className="text-sm text-gray-600 font-medium">
            Monthly revenue breakdown for the past 12 months
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-6 pb-2 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-gray-600"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-gray-600"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                domain={[0, 'dataMax']}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    formatter={(value: any) => currencyFormat(baseCurrency, value)}
                    indicator="line"
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

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
  return (
    <Card className="border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-200 pb-6">
        <div className="grid flex-1 gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Analysis</p>
          <CardTitle className="text-2xl font-bold text-gray-900">Top Performers</CardTitle>
          <CardDescription className="text-sm text-gray-600 font-medium">
            Highest revenue generating customers
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            {data.slice(0, 5).map((customer, index) => (
              <div key={index} className="space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">
                    {customer.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">
                    ${(customer.revenue / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{customer.percentage}% of total</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${customer.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          }
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No revenue data available for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};