import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

interface DashboardStats {
  total_revenue: number;
  revenue_trend: number;
  active_projects: number;
  projects_trend: number;
  team_size: number;
  billable_hours: number;
  hours_trend: number;
}

interface DashboardData {
  stats: DashboardStats;
  revenue_chart: any[];
  revenue_by_customer: any[];
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  time_ago: string;
  icon: string;
  metadata?: any;
}

interface ActivitiesResponse {
  activities: Activity[];
  has_more: boolean;
  total_count: number;
}

const fetchDashboardData = async (
  timeframe: string
): Promise<DashboardData> => {
  const controller = new globalThis.AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`/api/v1/dashboard?timeframe=${timeframe}`, {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN":
          document
            .querySelector('[name="csrf-token"]')
            ?.getAttribute("content") || "",
      },
      credentials: "include",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `Dashboard API error: ${response.status}, using fallback data`
      );
      window.clearTimeout(timeoutId);

      return {
        stats: {
          total_revenue: 0,
          revenue_trend: 0,
          active_projects: 0,
          projects_trend: 0,
          team_size: 0,
          billable_hours: 0,
          hours_trend: 0,
        },
        revenue_chart: [],
        revenue_by_customer: [],
      };
    }

    const data = await response.json();
    window.clearTimeout(timeoutId);

    return data;
  } catch (error) {
    window.clearTimeout(timeoutId);
    console.warn("Dashboard API error, using fallback data", error);

    return {
      stats: {
        total_revenue: 0,
        revenue_trend: 0,
        active_projects: 0,
        projects_trend: 0,
        team_size: 0,
        billable_hours: 0,
        hours_trend: 0,
      },
      revenue_chart: [],
      revenue_by_customer: [],
    };
  }
};

const fetchActivities = async ({
  pageParam = 0,
}): Promise<ActivitiesResponse> => {
  const controller = new globalThis.AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `/api/v1/dashboard/activities?offset=${pageParam}&per_page=10`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            document
              .querySelector('[name="csrf-token"]')
              ?.getAttribute("content") || "",
        },
        credentials: "include",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      console.warn(
        `Activities API error: ${response.status}, using fallback data`
      );
      window.clearTimeout(timeoutId);

      return {
        activities: [],
        has_more: false,
        total_count: 0,
      };
    }

    const data = await response.json();
    window.clearTimeout(timeoutId);

    return data;
  } catch (error) {
    window.clearTimeout(timeoutId);
    console.warn("Activities API error, using fallback data", error);

    return {
      activities: [],
      has_more: false,
      total_count: 0,
    };
  }
};

export const useDashboardData = (timeframe: string) =>
  useQuery({
    queryKey: ["dashboard", timeframe],
    queryFn: () => fetchDashboardData(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

export const useActivities = () =>
  useInfiniteQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;

      return allPages.length * 10; // offset for next page
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

export type { DashboardData, DashboardStats, Activity, ActivitiesResponse };
