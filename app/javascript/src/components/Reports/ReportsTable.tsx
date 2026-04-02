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
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
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
  Users,
  Briefcase,
  CreditCard,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { i18n } from "../../i18n";

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  url: string;
  available: boolean;
  category: "time" | "financial" | "client" | "team";
}

const getReportCards = (): ReportCard[] => [
  {
    id: "time-entry",
    title: i18n.t("reports.timeReports"),
    description: i18n.t("reports.timeReportsDesc"),
    icon: Clock,
    url: "/reports/time-entry",
    available: true,
    category: "time",
  },
  {
    id: "invoices",
    title: i18n.t("reports.outstandingOverdueInvoicesTitle"),
    description: i18n.t("reports.outstandingOverdueInvoicesDesc"),
    icon: Receipt,
    url: "/reports/outstanding-overdue-invoices",
    available: true,
    category: "financial",
  },
  {
    id: "revenue",
    title: i18n.t("reports.revenueByClient"),
    description: i18n.t("reports.revenueByClientDesc"),
    icon: TrendUp,
    url: "/reports/revenue-by-client",
    available: true,
    category: "financial",
  },
  {
    id: "accounts-aging",
    title: i18n.t("reports.accountsAging"),
    description: i18n.t("reports.accountsAgingTableDesc"),
    icon: Calendar,
    url: "/reports/accounts-aging",
    available: true,
    category: "financial",
  },
  {
    id: "payments",
    title: i18n.t("reports.paymentReportTitle"),
    description: i18n.t("reports.paymentReportDesc"),
    icon: CreditCard,
    url: "/reports/payments",
    available: true,
    category: "financial",
  },
  {
    id: "team-utilization",
    title: i18n.t("reports.teamUtilization"),
    description: i18n.t("reports.teamUtilizationDesc"),
    icon: Users,
    url: "/reports/team-utilization",
    available: false,
    category: "team",
  },
  {
    id: "project-profitability",
    title: i18n.t("reports.projectProfitability"),
    description: i18n.t("reports.projectProfitabilityDesc"),
    icon: Briefcase,
    url: "/reports/project-profitability",
    available: false,
    category: "client",
  },
  {
    id: "client-summary",
    title: i18n.t("reports.clientSummaryTitle"),
    description: i18n.t("reports.clientSummaryDesc"),
    icon: FileText,
    url: "/reports/client-summary",
    available: false,
    category: "client",
  },
];

const ReportsTable: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const reportCards = getReportCards();

  const handleReportKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    url: string,
    available: boolean
  ) => {
    if (!available) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(url);
    }
  };

  const filteredReports =
    selectedCategory === "all"
      ? reportCards
      : reportCards.filter(report => report.category === selectedCategory);

  const availableReports = filteredReports.filter(r => r.available);
  const comingSoonReports = filteredReports.filter(r => !r.available);

  const openReportScheduleSettings = () => {
    navigate("/settings/preferences");
  };

  const stats = {
    totalReports: reportCards.filter(r => r.available).length,
    timeReports: reportCards.filter(r => r.category === "time" && r.available)
      .length,
    financialReports: reportCards.filter(
      r => r.category === "financial" && r.available
    ).length,
    recentlyViewed: 3,
  };

  return (
    <div className="w-full space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="mt-1 text-sm text-muted-foreground">
            {i18n.t("reports.understandReportsAtGlance")}
          </p>
        </div>
        <Button
          variant="outline"
          className="border-border bg-card text-foreground"
          onClick={openReportScheduleSettings}
        >
          <Calendar size={20} className="mr-2" />
          {i18n.t("reports.scheduleReports")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.availableReports")}
            </CardTitle>
            <ChartBar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("reports.readyToRun")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.timeReports")}
            </CardTitle>
            <Clock size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.timeReports}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("reports.hoursAndTime")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.financial")}
            </CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.financialReports}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("reports.revenueAndBilling")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("reports.recentlyViewed")}
            </CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyViewed}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("reports.lastSevenDays")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 gap-2 bg-muted p-1 md:grid-cols-5">
          <TabsTrigger value="all">{i18n.t("reports.allReports")}</TabsTrigger>
          <TabsTrigger value="time">{i18n.t("reports.time")}</TabsTrigger>
          <TabsTrigger value="financial">
            {i18n.t("reports.financial")}
          </TabsTrigger>
          <TabsTrigger value="client">{i18n.t("client")}</TabsTrigger>
          <TabsTrigger value="team">{i18n.t("team.team")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Available Reports */}
      {availableReports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {i18n.t("reports.availableReports")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableReports.map(report => {
              const Icon = report.icon;

              return (
                <Card
                  key={report.id}
                  className="group cursor-pointer border-border transition-all hover:shadow-lg"
                  onClick={() => navigate(report.url)}
                  onKeyDown={event =>
                    handleReportKeyDown(event, report.url, report.available)
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={i18n.t("reports.openReport", {
                    title: report.title,
                  })}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "rounded-lg bg-muted p-2 transition-colors group-hover:bg-accent"
                        )}
                      >
                        <Icon size={24} className="text-foreground" />
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-muted-foreground transition-colors group-hover:text-foreground"
                      />
                    </div>
                    <CardTitle className="text-lg mt-4">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {report.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="border-border bg-background text-xs text-foreground"
                      >
                        {report.category.charAt(0).toUpperCase() +
                          report.category.slice(1)}
                      </Badge>
                      <span className="inline-flex items-center text-sm text-muted-foreground">
                        <Download size={16} className="mr-1" />
                        {i18n.t("reports.export")}
                      </span>
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
          <h2 className="text-lg font-semibold text-foreground">
            {i18n.t("reports.comingSoon")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comingSoonReports.map(report => {
              const Icon = report.icon;

              return (
                <Card
                  key={report.id}
                  className="border-border bg-muted/30 opacity-80"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon size={24} className="text-muted-foreground" />
                      </div>
                      <Badge className="border-border bg-background text-muted-foreground hover:bg-background">
                        {i18n.t("reports.comingSoon")}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg text-foreground/80">
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
      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle>{i18n.t("reports.quickActions")}</CardTitle>
          <CardDescription>
            {i18n.t("reports.commonReportingTasks")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start border-border bg-card hover:bg-accent"
              onClick={() => navigate("/reports/time-entry")}
            >
              <Clock size={20} className="mr-2" />
              {i18n.t("reports.generateWeeklyTimesheet")}
            </Button>
            <Button
              variant="outline"
              className="justify-start border-border bg-card hover:bg-accent"
              onClick={() => navigate("/reports/outstanding-overdue-invoices")}
            >
              <Receipt size={20} className="mr-2" />
              {i18n.t("reports.viewOverdueInvoices")}
            </Button>
            <Button
              variant="outline"
              className="justify-start border-border bg-card hover:bg-accent"
              onClick={() => navigate("/reports/revenue-by-client")}
            >
              <TrendUp size={20} className="mr-2" />
              {i18n.t("reports.monthlyRevenueReport")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTable;
