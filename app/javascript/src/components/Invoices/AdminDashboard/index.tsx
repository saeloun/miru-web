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
import { cn } from "@/lib/utils";
import MonthlyRevenueChart from "../MonthlyRevenueChart";
import InfiniteScrollRecentlyUpdated from "../List/RecentlyUpdated/InfiniteScrollRecentlyUpdated";
import { currencyFormat } from "helpers/currency";

interface AdminDashboardProps {
  summary: {
    overdueAmount: number;
    outstandingAmount: number;
    draftAmount: number;
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

  const applyFilter = (status: any) => {
    setFilterParams({
      ...filterParams,
      status,
    });
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: currencyFormat(
        baseCurrency,
        summary.outstandingAmount + summary.draftAmount
      ),
      description: "All time revenue",
      icon: CurrencyDollar,
      trend: { value: 12.5, isPositive: true },
      color: "text-foreground",
      bgColor: "bg-card",
    },
    {
      title: "Outstanding",
      value: currencyFormat(baseCurrency, summary.outstandingAmount),
      description: "Awaiting payment",
      icon: Clock,
      trend: { value: 8.2, isPositive: false },
      color: "text-foreground",
      bgColor: "bg-card",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: "OVERDUE" },
        ]),
    },
    {
      title: "Overdue",
      value: currencyFormat(baseCurrency, summary.overdueAmount),
      description: "Requires attention",
      icon: Warning,
      trend: { value: 3.1, isPositive: false },
      color: "text-foreground",
      bgColor: "bg-card",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      title: "Draft",
      value: currencyFormat(baseCurrency, summary.draftAmount),
      description: "Not yet sent",
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
                Invoice Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage your invoices efficiently
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
              <Button className="w-full sm:w-auto" variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
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
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Monthly revenue for the last 12 months
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={chartType === "area" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("area")}
                  >
                    Area
                  </Button>
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    Bar
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
              <CardTitle>Revenue by Status</CardTitle>
              <CardDescription>
                Distribution of invoice statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                    <CurrencyDollar className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Paid</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, 0)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-card-foreground"
                  >
                    0%
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                    <Clock className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Outstanding</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, summary.outstandingAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-card-foreground"
                  >
                    {(
                      (summary.outstandingAmount /
                        (summary.outstandingAmount + summary.draftAmount)) *
                      100
                    ).toFixed(0)}
                    %
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                    <Warning className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Overdue</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, summary.overdueAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border bg-card text-card-foreground"
                  >
                    {(
                      (summary.overdueAmount /
                        (summary.outstandingAmount + summary.draftAmount)) *
                      100
                    ).toFixed(0)}
                    %
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Draft</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, summary.draftAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-muted/40 text-muted-foreground border-border"
                  >
                    {(
                      (summary.draftAmount /
                        (summary.outstandingAmount + summary.draftAmount)) *
                      100
                    ).toFixed(0)}
                    %
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest invoice updates and changes
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
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
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>
                  A list of all invoices including their status and amount.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Funnel className="mr-2 h-4 w-4" />
                Funnel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          Invoice
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          Client
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          Amount
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          Status
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          Date
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">
                          Actions
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
                              View
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
