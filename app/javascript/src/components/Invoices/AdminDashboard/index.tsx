import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollar,
  FileText,
  Clock,
  Warning,
  Download,
  Plus,
  Funnel,
} from "phosphor-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import MonthlyRevenueChart from "../MonthlyRevenueChart";
import InfiniteScrollRecentlyUpdated from "../List/RecentlyUpdated/InfiniteScrollRecentlyUpdated";
import { currencyFormat } from "helpers/currency";
import { i18n } from "../../../i18n";

interface AdminDashboardProps {
  summary: {
    overdueAmount: number | string;
    openAmount?: number | string;
    outstandingAmount: number | string;
    draftAmount: number | string;
    currency: string;
  };
  invoices: any[];
  filterParams: any;
  setFilterParams: (params: any) => void;
  isDesktop: boolean;
  fetchInvoices: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  summary,
  invoices,
  filterParams,
  setFilterParams,
  isDesktop,
  fetchInvoices,
}) => {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const baseCurrency = invoices[0]?.company?.baseCurrency || "USD";
  const parseAmount = (value: number | string): number => {
    if (typeof value === "number") return value;
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  };
  const overdueAmount = parseAmount(summary.overdueAmount);
  const outstandingAmount = parseAmount(summary.outstandingAmount);
  const providedOpenAmount = parseAmount(summary.openAmount ?? 0);
  const draftAmount = parseAmount(summary.draftAmount);
  const openAmount =
    summary.openAmount !== undefined
      ? providedOpenAmount
      : Math.max(outstandingAmount - overdueAmount, 0);

  const { data: revenueByStatusData } = useQuery({
    queryKey: ["invoices", "analytics", "revenue_by_status"],
    queryFn: async () => {
      const response = await fetch(
        "/api/v1/invoices/analytics/revenue_by_status",
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN":
              document
                .querySelector('[name="csrf-token"]')
                ?.getAttribute("content") || "",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load invoice status revenue");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const paidAmount = parseAmount(
    revenueByStatusData?.status_data?.find(item => item.status === "paid")
      ?.revenue ?? 0
  );

  const invoiceStatusTotal =
    openAmount + overdueAmount + draftAmount + paidAmount;

  const formatStatusShare = (amount: number) => {
    if (invoiceStatusTotal <= 0 || amount <= 0) {
      return i18n.t("invoices.noData");
    }

    return `${((amount / invoiceStatusTotal) * 100).toFixed(0)}%`;
  };

  const applyFilter = (status: any) => {
    setFilterParams({
      ...filterParams,
      status,
    });
  };

  const statsCards = [
    {
      title: i18n.t("reports.totalRevenue"),
      value: currencyFormat(baseCurrency, invoiceStatusTotal),
      description: "",
      icon: CurrencyDollar,
      trend: { value: 12.5, isPositive: true },
      color: "text-foreground",
      bgColor: "bg-card",
    },
    {
      title: i18n.t("invoices.outstanding"),
      value: currencyFormat(baseCurrency, openAmount),
      description: "",
      icon: Clock,
      trend: { value: 8.2, isPositive: false },
      color: "text-foreground",
      bgColor: "bg-card",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
        ]),
    },
    {
      title: i18n.t("invoices.overdue"),
      value: currencyFormat(baseCurrency, overdueAmount),
      description: "",
      icon: Warning,
      trend: { value: 3.1, isPositive: false },
      color: "text-foreground",
      bgColor: "bg-card",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      title: i18n.t("invoices.draft"),
      value: currencyFormat(baseCurrency, draftAmount),
      description: "",
      icon: FileText,
      color: "text-muted-foreground",
      bgColor: "bg-muted/40",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {i18n.t("invoices.invoices")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1"></p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <Button className="w-full sm:w-auto" variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {i18n.t("reports.export")}
              </Button>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {i18n.t("invoices.generateInvoice")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <Card
                key={index}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  stat.onClick && "hover:scale-[1.02]"
                )}
                onClick={stat.onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={cn(
                      "rounded-lg border border-border p-2",
                      stat.bgColor
                    )}
                  >
                    <Icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-2">
                    {stat.trend && (
                      <div
                        className={cn(
                          "flex items-center text-xs font-medium",
                          stat.trend.isPositive
                            ? "text-foreground"
                            : "text-red-600"
                        )}
                      >
                        {stat.trend.isPositive ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {stat.trend.value}%
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

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {i18n.t("invoiceDashboard.revenueOverview")}
                  </CardTitle>
                  <CardDescription></CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={chartType === "area" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("area")}
                  >
                    {i18n.t("invoices.area")}
                  </Button>
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    {i18n.t("invoices.bar")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyRevenueChart
                baseCurrency={baseCurrency}
                chartType={chartType}
                height={350}
                onChartTypeChange={setChartType}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>
                {i18n.t("invoiceDashboard.revenueByStatus")}
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                    <CurrencyDollar className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">
                      {i18n.t("invoices.paid")}
                    </p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, paidAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-card-foreground"
                  >
                    {formatStatusShare(paidAmount)}
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                    <Clock className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">
                      {i18n.t("invoices.outstanding")}
                    </p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, openAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-card-foreground"
                  >
                    {formatStatusShare(openAmount)}
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                    <Warning className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">
                      {i18n.t("invoices.overdue")}
                    </p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, overdueAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-card-foreground"
                  >
                    {formatStatusShare(overdueAmount)}
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">
                      {i18n.t("invoices.draft")}
                    </p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, draftAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-muted/40 text-muted-foreground border-border"
                  >
                    {formatStatusShare(draftAmount)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {i18n.t("invoiceDashboard.recentActivity")}
                </CardTitle>
                <CardDescription></CardDescription>
              </div>
              <Button variant="outline" size="sm">
                {i18n.t("all")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <InfiniteScrollRecentlyUpdated />
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{i18n.t("invoiceDashboard.allInvoices")}</CardTitle>
                <CardDescription></CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Funnel className="mr-2 h-4 w-4" />
                {i18n.t("filters")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">{i18n.t("all")}</TabsTrigger>
                <TabsTrigger value="paid">
                  {i18n.t("invoices.paid")}
                </TabsTrigger>
                <TabsTrigger value="outstanding">
                  {i18n.t("invoices.outstanding")}
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  {i18n.t("invoices.overdue")}
                </TabsTrigger>
                <TabsTrigger value="draft">
                  {i18n.t("invoices.draft")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          {i18n.t("invoices.invoice")}
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          {i18n.t("client")}
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          {i18n.t("amount")}
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          {i18n.t("status")}
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          {i18n.t("date")}
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          {i18n.t("actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 5).map((invoice, index) => (
                        <tr
                          key={invoice.id}
                          className="border-b hover:bg-muted/40"
                        >
                          <td className="p-3 text-sm font-medium">
                            #{invoice.invoiceNumber}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {invoice.client.name}
                          </td>
                          <td className="p-3 text-sm font-medium">
                            {currencyFormat(
                              invoice.company.baseCurrency,
                              invoice.amount
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-border bg-card text-card-foreground",
                                invoice.status === "draft" &&
                                  "bg-muted/40 text-muted-foreground"
                              )}
                            >
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {invoice.issueDate}
                          </td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm">
                              {i18n.t("invoices.invoice")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
