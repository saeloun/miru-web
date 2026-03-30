import React, { useEffect, useRef } from "react";
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
import { getActiveLocale, t } from "../../i18n";

interface DashboardHomeProps {
  user?: any;
  company?: any;
  companyRole?: string;
  isDesktop?: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  company,
  companyRole,
  isDesktop,
}) => {
  const timeframe = "year";
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
  const isEmployee = companyRole === "employee";
  const isClient = companyRole === "client";
  const activeLocale = getActiveLocale();

  const timeframeLabel = (() => {
    switch (timeframe) {
      case "year":
        return t("dashboard.timeframe.year");
      case "quarter":
        return t("dashboard.timeframe.quarter");
      case "month":
        return t("dashboard.timeframe.month");
      case "week":
        return t("dashboard.timeframe.week");
      default:
        return t("dashboard.timeframe.year");
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

  const financialStatsCards = [
    {
      title: t("dashboard.stats.revenue"),
      value: currencyFormat(baseCurrency, statsData.total_revenue),
      description: timeframeLabel,
      icon: CurrencyCircleDollar,
      trend: {
        value: statsData.revenue_trend,
        isPositive: statsData.revenue_trend > 0,
      },
    },
    {
      title: t("dashboard.stats.activeProjects"),
      value: statsData.active_projects.toString(),
      description:
        statsData.active_projects > 0
          ? t("dashboard.stats.currentlyActive")
          : t("dashboard.stats.noRecentActivity"),
      icon: Briefcase,
      trend: {
        value: statsData.projects_trend,
        isPositive: statsData.projects_trend > 0,
      },
    },
    {
      title: t("dashboard.stats.teamSize"),
      value: statsData.team_size.toString(),
      description: t("dashboard.stats.teammates"),
      icon: UsersThree,
    },
    {
      title: t("dashboard.stats.hoursTracked"),
      value: Math.round(statsData.billable_hours).toLocaleString(activeLocale),
      description: timeframeLabel,
      icon: Timer,
      trend: {
        value: statsData.hours_trend,
        isPositive: statsData.hours_trend > 0,
      },
    },
  ];

  const employeeStatsCards = [
    {
      title: t("dashboard.stats.assignedProjects"),
      value: statsData.active_projects.toString(),
      description: t("dashboard.stats.projectsYouCanWorkOn"),
      icon: Briefcase,
    },
    {
      title: t("dashboard.stats.hoursTracked"),
      value: Math.round(statsData.billable_hours).toLocaleString(activeLocale),
      description: timeframeLabel,
      icon: Timer,
      trend: {
        value: statsData.hours_trend,
        isPositive: statsData.hours_trend > 0,
      },
    },
  ];

  const clientStatsCards = [
    {
      title: t("dashboard.stats.totalInvoiced"),
      value: currencyFormat(baseCurrency, statsData.total_revenue),
      description: timeframeLabel,
      icon: CurrencyCircleDollar,
    },
    {
      title: t("dashboard.stats.openInvoices"),
      value: (statsData.open_invoices || 0).toString(),
      description: t("dashboard.stats.awaitingPayment"),
      icon: Receipt,
    },
    {
      title: t("dashboard.stats.paidInvoices"),
      value: (statsData.paid_invoices || 0).toString(),
      description: t("dashboard.stats.alreadySettled"),
      icon: Receipt,
    },
    {
      title: t("dashboard.stats.paymentsReceived"),
      value: currencyFormat(baseCurrency, statsData.payments_received || 0),
      description: timeframeLabel,
      icon: CurrencyCircleDollar,
    },
  ];

  const roleGuidance = (() => {
    switch (companyRole) {
      case "employee":
        return t("dashboard.roleGuidance.employee");
      case "book_keeper":
        return t("dashboard.roleGuidance.bookKeeper");
      case "client":
        return t("dashboard.roleGuidance.client");
      default:
        return t("dashboard.roleGuidance.default");
    }
  })();

  const statsCards = isEmployee
    ? employeeStatsCards
    : isClient
    ? clientStatsCards
    : financialStatsCards;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="border rounded-lg p-6 bg-card">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground tracking-wider mb-1">
            {t("dashboard.companyPulse")}
          </p>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {t("dashboard.welcomeBack", {
              name:
                user?.first_name ||
                user?.name?.split(" ")[0] ||
                t("dashboard.there"),
            })}
          </h1>
          <p className="text-muted-foreground">{roleGuidance}</p>
        </div>
      </div>

      <div
        className={`grid gap-4 md:grid-cols-2 ${
          isEmployee ? "lg:grid-cols-2" : "lg:grid-cols-4"
        }`}
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const showTrend = Boolean(stat.trend && stat.trend.value !== 0);

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
                  {showTrend && stat.trend && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {stat.trend.isPositive ? (
                        <TrendUp
                          size={12}
                          weight="bold"
                          className="mr-1 text-foreground"
                        />
                      ) : (
                        <TrendDown
                          size={12}
                          weight="bold"
                          className="mr-1 text-destructive"
                        />
                      )}
                      <span
                        className={
                          stat.trend.isPositive
                            ? "text-foreground"
                            : "text-destructive"
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

      {!isEmployee && !isClient && (
        <div className="grid gap-4 lg:grid-cols-10">
          <div className="lg:col-span-7">
            <RevenueAreaChart
              data={revenueData}
              baseCurrency={baseCurrency}
              loading={isDashboardLoading}
            />
          </div>
          <div className="lg:col-span-3">
            <CustomerRevenueChart
              data={customerRevenueData}
              baseCurrency={baseCurrency}
              loading={isDashboardLoading}
            />
          </div>
        </div>
      )}

      {isClient && (
        <div className="grid gap-4 lg:grid-cols-1">
          <RevenueAreaChart
            data={revenueData}
            baseCurrency={baseCurrency}
            loading={isDashboardLoading}
          />
        </div>
      )}

      <Card className="border border-border hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {isClient
                  ? t("dashboard.recentActivity")
                  : t("dashboard.workspaceActivity")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {isEmployee
                  ? t("dashboard.employeeActivityDescription")
                  : t("dashboard.activityDescription")}
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
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt
                    size={48}
                    className="mx-auto mb-3 text-muted-foreground/50"
                  />
                  <p>{t("dashboard.noRecentActivityYet")}</p>
                </div>
              ) : (
                allActivities.map(activity => {
                  const Icon = getActivityIcon(activity.icon);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-muted mt-0.5">
                        <Icon
                          size={16}
                          weight="light"
                          className="text-foreground/80"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.time_ago}
                        </p>
                        {activity.metadata && (
                          <div className="flex items-center gap-2 mt-1">
                            {activity.metadata.amount && (
                              <span className="text-xs font-medium text-muted-foreground">
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
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <SpinnerGap size={16} className="animate-spin mr-2" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("dashboard.loadMore")
                    )}
                  </Button>
                </div>
              )}

              {!hasNextPage && allActivities.length > 0 && (
                <div className="text-center py-4 text-muted-foreground/70 text-sm">
                  {t("dashboard.caughtUp")}
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
