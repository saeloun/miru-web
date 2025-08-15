// features/invoices/routes/dashboard/loader.ts
// Data fetching logic separated from components

import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "@/features/invoices/api";

export interface DashboardData {
  summary: {
    overdueAmount: number;
    outstandingAmount: number;
    draftAmount: number;
    currency: string;
  };
  invoices: any[];
  recentlyUpdated: any[];
  monthlyRevenue: any[];
  filters: {
    clients: any[];
    statuses: string[];
    dateRanges: string[];
  };
}

// Loader function - can be used for SSR or prefetching
export async function loader(): Promise<DashboardData> {
  const [summary, invoices, recentlyUpdated, monthlyRevenue, filters] =
    await Promise.all([
      invoicesApi.getSummary(),
      invoicesApi.getInvoices({ page: 1, perPage: 10 }),
      invoicesApi.getRecentlyUpdated(),
      invoicesApi.getMonthlyRevenue(),
      invoicesApi.getFilters(),
    ]);

  return {
    summary: summary.data,
    invoices: invoices.data,
    recentlyUpdated: recentlyUpdated.data,
    monthlyRevenue: monthlyRevenue.data,
    filters: filters.data,
  };
}

// React Query hook for client-side data fetching
export function useDashboardData() {
  return useQuery({
    queryKey: ["invoices", "dashboard"],
    queryFn: loader,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Individual data hooks for granular updates
export function useInvoiceSummary() {
  return useQuery({
    queryKey: ["invoices", "summary"],
    queryFn: () => invoicesApi.getSummary(),
    select: data => data.data,
  });
}

export function useInvoiceList(params: any) {
  return useQuery({
    queryKey: ["invoices", "list", params],
    queryFn: () => invoicesApi.getInvoices(params),
    select: data => data.data,
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ["invoices", "monthly-revenue"],
    queryFn: () => invoicesApi.getMonthlyRevenue(),
    select: data => data.data,
  });
}
