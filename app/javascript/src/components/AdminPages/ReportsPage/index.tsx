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
      color:
        "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
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
          path: "/reports/outstanding-overdue-invoice",
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
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
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
      reports: category.reports.filter(
        report =>
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(category => category.reports.length > 0);

  const handleReportClick = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50/50 dark:bg-gray-900/50",
        className
      )}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#5B34EA]/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-[#5B34EA]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Reports & Analytics
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Comprehensive insights into your business performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* MagnifyingGlass */}
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Reports..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B34EA] focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <Button variant="outline" size="sm">
                <Funnel className="mr-2 h-4 w-4" />
                Funnel
              </Button>

              <Button className="bg-[#5B34EA] hover:bg-[#4926D1]" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs mt-2",
                          isPositive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        <TrendUp
                          className={cn("w-3 h-3", !isPositive && "rotate-180")}
                        />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-[#5B34EA]/10 transition-colors">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-[#5B34EA] transition-colors" />
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
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#5B34EA]/30"
                      onClick={() => handleReportClick(report.path)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-[#5B34EA]/10 transition-colors">
                              <ReportIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-[#5B34EA] transition-colors" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#5B34EA] transition-colors">
                                {report.title}
                              </h3>
                              {report.isPopular && (
                                <Badge
                                  variant="secondary"
                                  className="mt-1 bg-orange-100 text-orange-600 text-xs"
                                >
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#5B34EA] transition-colors" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {report.stats}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
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
            <MagnifyingGlass className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No reports found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search query to find the reports you're looking
              for
            </p>
          </div>
        )}

        {/* Empty state when no search */}
        {!searchQuery && filteredReports.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Welcome to Reports
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
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
