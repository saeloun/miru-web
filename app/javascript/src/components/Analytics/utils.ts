import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { currencyFormat } from "helpers";

export const ANALYTICS_PRESETS = [
  { value: "last_30_days", label: "30 days" },
  { value: "last_90_days", label: "90 days" },
  { value: "last_180_days", label: "180 days" },
  { value: "last_365_days", label: "365 days" },
  { value: "custom", label: "Custom" },
] as const;

export const DEFAULT_ANALYTICS_PRESET = "last_30_days";

export const resolveAnalyticsPreset = (
  preset: string
): DateRange | undefined => {
  const now = new Date();

  switch (preset) {
    case "last_30_days":
      return { from: subDays(now, 30), to: now };
    case "last_90_days":
      return { from: subDays(now, 90), to: now };
    case "last_180_days":
      return { from: subDays(now, 180), to: now };
    case "last_365_days":
      return { from: subDays(now, 365), to: now };
    case "custom":
      return undefined;
    default:
      return { from: subDays(now, 30), to: now };
  }
};

export const formatPercent = (value?: number) => `${(value || 0).toFixed(2)}%`;

export const formatCompactCurrency = (currency: string, value: number) =>
  currencyFormat(currency || "USD", value || 0, "compact");

export const formatStandardCurrency = (currency: string, value: number) =>
  currencyFormat(currency || "USD", value || 0);

export const getTrendText = (value?: string) => {
  switch (value) {
    case "up":
      return "Uptrend";
    case "down":
      return "Downtrend";
    default:
      return "Flat";
  }
};

export const buildTrendSeries = (
  trends: Array<{
    name: string;
    monthly_totals: Array<{ label: string; amount: number }>;
  }>
) => {
  if (trends.length === 0) return [];

  const labels = Array.from(
    new Set(
      trends.flatMap(trend => trend.monthly_totals.map(point => point.label))
    )
  );

  return labels.map(label =>
    trends.reduce(
      (row, trend) => {
        const point = trend.monthly_totals.find(point => point.label === label);

        return {
          ...row,
          label,
          [trend.name]: point?.amount ?? 0,
        };
      },
      { label } as Record<string, string | number>
    )
  );
};

export const chartPalette = [
  "#0f766e",
  "#f97316",
  "#7c3aed",
  "#2563eb",
  "#dc2626",
];
