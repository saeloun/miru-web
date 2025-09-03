import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  TrendUp,
  TrendDown,
  CurrencyCircleDollar,
  Receipt,
  Timer,
  UsersThree,
  Briefcase,
  SpinnerGap,
} from "phosphor-react";
import { RevenueAreaChart, CustomerRevenueChart } from "./MonochromeCharts";
import { currencyFormat } from "../../helpers/currency";
import { useDashboardData, useActivities } from "../../hooks/useDashboard";

interface DashboardHomeProps {
  user?: any;
  company?: any;
  isDesktop?: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  company,
  isDesktop,
}) => {
  const [timeframe, setTimeframe] = useState("year");
  const activitiesContainerRef = useRef<HTMLDivElement>(null);

  // TanStack Query hooks
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useDashboardData(timeframe);

  const {
    data: activitiesData,
    isLoading: isActivitiesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useActivities();

  const baseCurrency = company?.baseCurrency || "USD";

  const timeframeLabel = (() => {
    switch (timeframe) {
      case "year":
        return "Year to date";
      case "quarter":
        return "Quarter to date";
      case "month":
        return "Month to date";
      case "week":
        return "Week to date";
      default:
        return "Year to date";
    }
  })();

  // Derived data from TanStack Query
  const allActivities =
    activitiesData?.pages.flatMap(page => page.activities) || [];

  const statsData = dashboardData?.stats || {
    total_revenue: 0,
    revenue_trend: 0,
    active_projects: 0,
    projects_trend: 0,
    team_size: 0,
    billable_hours: 0,
    hours_trend: 0,
  };
  const revenueData = dashboardData?.revenue_chart || [];
  const customerRevenueData = dashboardData?.revenue_by_customer || [];

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return Receipt;
      case "CurrencyDollar":
        return CurrencyCircleDollar;
      default:
        return Receipt;
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Infinite scroll for Workspace Activity
  useEffect(() => {
    const el = activitiesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 120;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    el.addEventListener("scroll", onScroll);

    return () => el.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const statsCards = [
    {
      title: "Revenue",
      value: currencyFormat(baseCurrency, statsData.total_revenue),
      description: timeframeLabel,
      icon: CurrencyCircleDollar,
      trend: {
        value: statsData.revenue_trend,
        isPositive: statsData.revenue_trend > 0,
      },
    },
    {
      title: "Active Projects",
      value: statsData.active_projects.toString(),
      description: "Currently active",
      icon: Briefcase,
      trend: {
        value: statsData.projects_trend,
        isPositive: statsData.projects_trend > 0,
      },
    },
    {
      title: "Team Size",
      value: statsData.team_size.toString(),
      description: "Teammates",
      icon: UsersThree,
    },
    {
      title: "Hours Tracked",
      value: Math.round(statsData.billable_hours).toLocaleString(),
      description: timeframeLabel,
      icon: Timer,
      trend: {
        value: statsData.hours_trend,
        isPositive: statsData.hours_trend > 0,
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="border rounded-lg p-6 bg-card">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Company Pulse
          </p>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Welcome back,{" "}
            {user?.first_name || user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground">
            {timeframeLabel} at a glance — revenue, projects, and team momentum.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon
                  size={16}
                  weight="light"
                  className="text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  {stat.trend && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {stat.trend.isPositive ? (
                        <TrendUp
                          size={12}
                          weight="bold"
                          className="mr-1 text-green-600"
                        />
                      ) : (
                        <TrendDown
                          size={12}
                          weight="bold"
                          className="mr-1 text-red-600"
                        />
                      )}
                      <span
                        className={
                          stat.trend.isPositive
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {stat.trend.value}%
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <RevenueAreaChart
            data={revenueData}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            baseCurrency={baseCurrency}
            loading={isDashboardLoading}
          />
        </div>
        <div className="lg:col-span-3">
          <CustomerRevenueChart
            data={customerRevenueData}
            timeframe={timeframe}
            baseCurrency={baseCurrency}
            loading={isDashboardLoading}
          />
        </div>
      </div>

      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Workspace Activity
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Latest updates across your invoices and payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={activitiesContainerRef}
            className="max-h-96 overflow-y-auto"
          >
            <div className="space-y-0 p-6">
              {allActivities.length === 0 && !isActivitiesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No recent activity yet</p>
                </div>
              ) : (
                allActivities.map(activity => {
                  const Icon = getActivityIcon(activity.icon);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 mt-0.5">
                        <Icon
                          size={16}
                          weight="light"
                          className="text-gray-700"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.time_ago}
                        </p>
                        {activity.metadata && (
                          <div className="flex items-center gap-2 mt-1">
                            {activity.metadata.amount && (
                              <span className="text-xs font-medium text-gray-600">
                                {currencyFormat(
                                  activity.metadata.currency,
                                  activity.metadata.amount
                                )}
                              </span>
                            )}
                            {activity.metadata.status && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.status}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {hasNextPage && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isFetchingNextPage}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <SpinnerGap size={16} className="animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}

              {!hasNextPage && allActivities.length > 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  You’re all caught up
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
