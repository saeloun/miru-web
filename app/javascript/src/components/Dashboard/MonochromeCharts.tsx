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
import { t } from "../../i18n";

interface RevenueChartProps {
  data: any[];
  baseCurrency: string;
  loading?: boolean;
}

const chartConfig = {
  revenue: {
    label: t("dashboard.stats.revenue"),
    color: "hsl(var(--primary))",
  },
  invoices: {
    label: t("nav.invoices"),
    color: "hsl(var(--primary) / 0.6)",
  },
};

const customerChartConfig = {
  revenue: {
    label: t("dashboard.stats.revenue"),
    color: "hsl(var(--primary))",
  },
};

export const RevenueAreaChart: React.FC<RevenueChartProps> = ({
  data,
  baseCurrency,
  loading,
}) => (
  <Card className="border border-border shadow-sm transition-all duration-300 bg-card">
    <CardHeader className="border-b border-border pb-6 bg-card">
      <div className="grid flex-1 gap-2">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">
          {t("dashboard.charts.revenueTrendEyebrow")}
        </p>
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          {t("dashboard.charts.revenueMomentumTitle")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground font-medium">
          {t("dashboard.charts.revenueMomentumDescription")}
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="px-2 pt-6 pb-2 sm:px-6">
      {loading ? (
        <div className="flex items-center justify-center h-[320px]">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
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
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.26}
                />
                <stop
                  offset="70%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.12}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="strokeRevenue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feFlood floodColor="hsl(var(--primary))" floodOpacity="0.15" />
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
              dataKey="full_month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
                fontWeight: 500,
              }}
              tickFormatter={value => {
                // Format "January 2024" to "Jan '24"
                const fullMonth = String(value);
                const match = fullMonth.match(/^([A-Za-z]+)\s+(\d{4})$/);
                if (!match) return fullMonth;

                return `${match[1].slice(0, 3)} '${match[2].slice(-2)}`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
                fontWeight: 500,
              }}
              tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
              domain={[0, "dataMax + 5000"]}
            />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={value => value}
                  formatter={(value: any) =>
                    currencyFormat(baseCurrency, value)
                  }
                  className="bg-card/95 backdrop-blur-sm shadow-xl border-0 rounded-lg"
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#colorRevenue)"
              stroke="url(#strokeRevenue)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 1.5,
                stroke: "hsl(var(--background))",
                fill: "hsl(var(--primary))",
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
  baseCurrency: string;
  loading?: boolean;
}

export const CustomerRevenueChart: React.FC<CustomerRevenueChartProps> = ({
  data,
  baseCurrency,
  loading,
}) => {
  const gradientColors = [
    "linear-gradient(90deg, hsl(var(--primary) / 0.72), hsl(var(--primary) / 0.6))",
    "linear-gradient(90deg, hsl(var(--primary) / 0.64), hsl(var(--primary) / 0.52))",
    "linear-gradient(90deg, hsl(var(--primary) / 0.56), hsl(var(--primary) / 0.44))",
    "linear-gradient(90deg, hsl(var(--primary) / 0.48), hsl(var(--primary) / 0.36))",
    "linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.3))",
  ];

  return (
    <Card className="border border-border shadow-sm h-full transition-all duration-300 bg-card">
      <CardHeader className="border-b border-border pb-6 bg-card">
        <div className="grid flex-1 gap-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            {t("dashboard.charts.topCustomersEyebrow")}
          </p>
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
            {t("dashboard.charts.revenueLeadersTitle")}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-medium">
            {t("dashboard.charts.revenueLeadersDescription")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            {data.slice(0, 5).map((customer, index) => (
              <div
                key={index}
                className="space-y-2 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all duration-200 group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground truncate max-w-[150px] group-hover:text-primary transition-colors">
                    {customer.name}
                  </span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    ${(customer.revenue / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("dashboard.charts.ofTotal", {
                        percentage: customer.percentage,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                      style={{
                        background:
                          gradientColors[index % gradientColors.length],
                        width: `${customer.percentage}%`,
                        animation: "slideIn 1s ease-out",
                      }}
                    >
                      <div className="absolute inset-0 bg-background/10"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <style>{`
              @keyframes slideIn {
                from {
                  width: 0;
                }
              }
            `}</style>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-2xl mb-3">📊</div>
            {t("dashboard.charts.noRevenue")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
