import { buildSearchParams } from "components/Reports/filterUtils";

export const analyticsReportPathMap = {
  revenue_forecast: "/analytics/revenue-forecast",
  team_productivity: "/analytics/team",
  client_analysis: "/analytics/clients",
  expense_trends: "/analytics/expenses",
} as const;

export const analyticsReportLabelMap = {
  revenue_forecast: "Revenue Forecast",
  team_productivity: "Team Analytics",
  client_analysis: "Client Insights",
  expense_trends: "Expense Trends",
} as const;

export const buildSavedReportSearch = (filters: Record<string, any>) => {
  const params = buildSearchParams(
    Object.entries(filters).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value == null || value === "" ? undefined : String(value),
      }),
      {}
    )
  );

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};
