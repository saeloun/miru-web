import { DateRange } from "react-day-picker";

export type AnalyticsSummaryCard = {
  label: string;
  value: string;
  helperText?: string;
};

export type AnalyticsOption = {
  id: number;
  label: string;
};

export type AnalyticsFiltersState = {
  dateRange: DateRange | undefined;
  preset: string;
  selectedIds: number[];
};

export type RevenueForecastPoint = {
  month: string;
  label: string;
  collected_revenue?: number;
  invoiced_revenue?: number;
  forecast_revenue?: number;
};

export type RevenueForecastResponse = {
  currency: string;
  horizon: number;
  historical_periods: RevenueForecastPoint[];
  forecast_periods: RevenueForecastPoint[];
};

export type TeamProductivityMember = {
  user_id: number;
  user_name: string;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  utilization_rate: number;
  billable_ratio: number;
  invoiced_revenue: number;
  average_hourly_rate: number;
};

export type TeamProductivityResponse = {
  period: { from: string; to: string };
  summary: {
    team_size: number;
    total_hours: number;
    billable_hours: number;
    non_billable_hours: number;
    utilization_rate: number;
    billable_ratio: number;
    invoiced_revenue: number;
    average_hourly_rate: number;
  };
  members: TeamProductivityMember[];
};

export type ClientMonthlyTrend = {
  month: string;
  label: string;
  revenue: number;
};

export type ClientAnalysisRow = {
  client_id: number;
  client_name: string;
  total_revenue: number;
  collected_revenue: number;
  invoice_count: number;
  payment_count: number;
  average_invoice_amount: number;
  payment_frequency_days: number;
  payment_cycle_days: number;
  trend_direction: string;
  monthly_trend: ClientMonthlyTrend[];
};

export type ClientAnalysisResponse = {
  period: { from: string; to: string };
  summary: {
    client_count: number;
    total_revenue: number;
    total_collected_revenue: number;
    average_invoice_amount: number;
    average_payment_frequency_days: number;
    average_payment_cycle_days: number;
    payment_count: number;
  };
  top_clients: ClientAnalysisRow[];
  clients: ClientAnalysisRow[];
};

export type ExpenseTrendPoint = {
  month: string;
  label: string;
  amount: number;
};

export type ExpenseTrendRow = {
  name: string;
  total_amount: number;
  monthly_totals: ExpenseTrendPoint[];
};

export type ExpenseAnomaly = {
  dimension: string;
  name: string;
  month: string;
  amount: number;
  rolling_average: number;
  threshold: number;
};

export type ExpenseTrendsResponse = {
  period: { from: string; to: string };
  summary: {
    total_expenses: number;
    expense_count: number;
    category_count: number;
    project_count: number;
    anomaly_count: number;
  };
  category_trends: ExpenseTrendRow[];
  project_trends: ExpenseTrendRow[];
  anomalies: ExpenseAnomaly[];
};

export type ComparisonMetric = {
  current: number;
  previous: number;
  change: number;
  change_percentage: number;
};

export type ComparisonResponse = {
  current_period: { from: string; to: string };
  previous_period: { from: string; to: string };
  metrics: {
    collected_revenue: ComparisonMetric;
    invoiced_revenue: ComparisonMetric;
    total_expenses: ComparisonMetric;
    billable_hours: ComparisonMetric;
    utilization_rate: ComparisonMetric;
    average_hourly_rate: ComparisonMetric;
  };
};
