import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  ChartBar,
  FileText,
  Clock,
  CurrencyDollar,
  Calendar,
  Download,
  ArrowRight,
  TrendUp,
  Receipt,
  Timer,
  Users,
  Briefcase,
  CreditCard,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  url: string;
  available: boolean;
  category: "time" | "financial" | "client" | "team";
}

const reportCards: ReportCard[] = [
  {
    id: "time-entry",
    title: "Time Entry Report",
    description: "A comprehensive summary of time entries added by your team members",
    icon: Clock,
    color: "text-blue-600",
    url: "/reports/time-entry",
    available: true,
    category: "time",
  },
  {
    id: "invoices",
    title: "Outstanding & Overdue Invoices",
    description: "Detailed overview of outstanding and overdue invoices across all clients",
    icon: Receipt,
    color: "text-green-600",
    url: "/reports/outstanding-overdue-invoice",
    available: true,
    category: "financial",
  },
  {
    id: "revenue",
    title: "Revenue by Client",
    description: "Revenue breakdown by client with trends and comparisons",
    icon: TrendUp,
    color: "text-purple-600",
    url: "/reports/revenue-by-client",
    available: true,
    category: "financial",
  },
  {
    id: "accounts-aging",
    title: "Accounts Aging",
    description: "Age analysis of outstanding receivables by time period",
    icon: Calendar,
    color: "text-orange-600",
    url: "/reports/accounts-aging",
    available: true,
    category: "financial",
  },
  {
    id: "payments",
    title: "Payment Report",
    description: "Track all payments received with detailed transaction history",
    icon: CreditCard,
    color: "text-indigo-600",
    url: "/reports/payments",
    available: true,
    category: "financial",
  },
  {
    id: "team-utilization",
    title: "Team Utilization",
    description: "Team member utilization rates and capacity analysis",
    icon: Users,
    color: "text-pink-600",
    url: "/reports/team-utilization",
    available: false,
    category: "team",
  },
  {
    id: "project-profitability",
    title: "Project Profitability",
    description: "Profitability analysis by project with cost breakdown",
    icon: Briefcase,
    color: "text-cyan-600",
    url: "/reports/project-profitability",
    available: false,
    category: "client",
  },
  {
    id: "client-summary",
    title: "Client Summary",
    description: "Comprehensive client performance and engagement metrics",
    icon: FileText,
    color: "text-gray-600",
    url: "/reports/client-summary",
    available: false,
    category: "client",
  },
];

const ReportsTable: React.FC = () => {
  const navigate = useNavigate();
  const { isAdminUser, company } = useUserContext();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredReports = selectedCategory === "all" 
    ? reportCards 
    : reportCards.filter(report => report.category === selectedCategory);

  const availableReports = filteredReports.filter(r => r.available);
  const comingSoonReports = filteredReports.filter(r => !r.available);

  const stats = {
    totalReports: reportCards.filter(r => r.available).length,
    timeReports: reportCards.filter(r => r.category === "time" && r.available).length,
    financialReports: reportCards.filter(r => r.category === "financial" && r.available).length,
    recentlyViewed: 3,
  };

  return (
    <div className="space-y-6 p-4 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate insights and analytics from your business data
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-white"
        >
          <Calendar size={20} className="mr-2" />
          Schedule Reports
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
            <ChartBar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-gray-600 mt-1">Ready to generate</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Reports</CardTitle>
            <Clock size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.timeReports}</div>
            <p className="text-xs text-gray-600 mt-1">Track time & hours</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Reports</CardTitle>
            <CurrencyDollar size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.financialReports}</div>
            <p className="text-xs text-gray-600 mt-1">Revenue & invoices</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Viewed</CardTitle>
            <FileText size={20} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyViewed}</div>
            <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Available Reports */}
      {availableReports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className="border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(report.url)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors",
                      )}>
                        <Icon size={24} className="text-gray-700" />
                      </div>
                      <ArrowRight 
                        size={20} 
                        className="text-gray-400 group-hover:text-gray-600 transition-colors"
                      />
                    </div>
                    <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {report.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle export
                        }}
                      >
                        <Download size={16} className="mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Coming Soon Reports */}
      {comingSoonReports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Coming Soon</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comingSoonReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className="border-gray-200 opacity-60"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Icon size={24} className="text-gray-400" />
                      </div>
                      <Badge className="bg-gray-100 text-gray-600">
                        Coming Soon
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-4 text-gray-600">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {report.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common reporting tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start bg-white"
              onClick={() => navigate("/reports/time-entry")}
            >
              <Clock size={20} className="mr-2" />
              Generate Weekly Timesheet
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white"
              onClick={() => navigate("/reports/outstanding-overdue-invoice")}
            >
              <Receipt size={20} className="mr-2" />
              View Overdue Invoices
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-white"
              onClick={() => navigate("/reports/revenue-by-client")}
            >
              <TrendUp size={20} className="mr-2" />
              Monthly Revenue Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTable;