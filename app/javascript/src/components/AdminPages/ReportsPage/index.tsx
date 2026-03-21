import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  BarChart3,
  TrendUp,
  CurrencyDollar,
  Clock,
  Download,
  Funnel,
  MagnifyingGlass,
  ArrowUpRight,
  FileText,
  ChartPie,
  Activity,
  Target,
} from "phosphor-react";
import { cn } from "../../../lib/utils";

interface ReportsPageProps {
  className?: string;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const reportCategories = [
    {
      id: "financial",
      name: "Financial Reports",
      description: "Revenue, billing, and payment analytics",
      icon: CurrencyDollar,
      color: "bg-card text-card-foreground border border-border",
      reports: [
        {
          title: "Revenue by Client",
          description: "Track revenue generated from each client",
          path: "/reports/revenue-by-client",
          icon: TrendUp,
          stats: "12 clients analyzed",
          isPopular: true,
        },
        {
          title: "Outstanding & Overdue Invoices",
          description: "Monitor unpaid and overdue invoices",
          path: "/reports/outstanding-overdue-invoices",
          icon: FileText,
          stats: "8 overdue invoices",
          isNew: false,
        },
        {
          title: "Accounts Aging Report",
          description: "Analyze payment patterns and aging",
          path: "/reports/accounts-aging",
          icon: ChartPie,
          stats: "Updated daily",
          isNew: false,
        },
      ],
    },
    {
      id: "time",
      name: "Time & Productivity",
      description: "Time tracking and productivity insights",
      icon: Clock,
      color: "bg-card text-card-foreground border border-border",
      reports: [
        {
          title: "Time Entry Report",
          description: "Detailed breakdown of time entries",
          path: "/reports/time-entry",
          icon: Activity,
          stats: "Last 30 days",
          isPopular: false,
        },
        {
          title: "Total Hours Logged",
          description: "Comprehensive hours tracking across projects",
          path: "/reports/total-hours",
          icon: Target,
          stats: "All projects",
          isNew: false,
        },
      ],
    },
  ];

  const quickStats = [
    {
      label: "Total Revenue",
      value: "$124,500",
      change: "+12.5%",
      trend: "up",
      icon: CurrencyDollar,
    },
    {
      label: "Hours Logged",
      value: "1,240",
      change: "+8.2%",
      trend: "up",
      icon: Clock,
    },
    {
      label: "Active Projects",
      value: "15",
      change: "+2",
      trend: "up",
      icon: Target,
    },
    {
      label: "Overdue Amount",
      value: "$8,300",
      change: "-15.3%",
      trend: "down",
      icon: FileText,
    },
  ];

  const filteredReports = reportCategories
    .map(category => ({
      ...category,
      reports: category.reports.filter(report => {
        const query = searchQuery.toLowerCase().trim();

        return (
          report.title.toLowerCase().includes(query) ||
          report.description.toLowerCase().includes(query)
        );
      }),
    }))
    .filter(category => category.reports.length > 0);

  const handleReportClick = (path: string) => {
    navigate(path);
  };

  const handleCardKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    path: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleReportClick(path);
    }
  };

  return (
    <div className={cn("min-h-screen bg-muted/30", className)}>
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Reports & Analytics
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive insights into your business performance
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:flex-nowrap">
              {/* MagnifyingGlass */}
              <div className="relative w-full sm:flex-1 lg:w-72 lg:flex-none">
                <label htmlFor="reports-search" className="sr-only">
                  Search reports
                </label>
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  id="reports-search"
                  type="text"
                  placeholder="Search Reports..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button
                className="w-full sm:w-auto"
                variant="outline"
                size="sm"
                disabled
                aria-disabled="true"
              >
                <Funnel className="mr-2 h-4 w-4" />
                Funnel
              </Button>

              <Button
                className="w-full bg-primary sm:w-auto"
                size="sm"
                disabled
                aria-disabled="true"
              >
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4 sm:p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = stat.trend === "up";

            return (
              <Card
                key={index}
                className="group hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs mt-2",
                          isPositive ? "text-emerald-600" : "text-destructive"
                        )}
                      >
                        <TrendUp
                          className={cn("w-3 h-3", !isPositive && "rotate-180")}
                        />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Categories */}
        {filteredReports.map(category => {
          const CategoryIcon = category.icon;

          return (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-lg", category.color)}>
                  <CategoryIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {category.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {category.reports.map((report, index) => {
                  const ReportIcon = report.icon;

                  return (
                    <Card
                      key={index}
                      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30"
                      onClick={() => handleReportClick(report.path)}
                      onKeyDown={e => handleCardKeyDown(e, report.path)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${report.title} report`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                              <ReportIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {report.title}
                              </h3>
                              {report.isPopular && (
                                <Badge
                                  variant="secondary"
                                  className="mt-1 text-xs"
                                >
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {report.stats}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            aria-label={`Export ${report.title} report`}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* No results */}
        {searchQuery && filteredReports.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlass className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No reports found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search query to find the reports you're looking
              for
            </p>
          </div>
        )}

        {/* Empty state when no search */}
        {!searchQuery && filteredReports.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Welcome to Reports
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generate comprehensive reports to analyze your business
              performance, track revenue, and monitor productivity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
