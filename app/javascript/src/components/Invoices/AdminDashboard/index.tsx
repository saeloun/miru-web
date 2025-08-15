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
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Filter,
} from "lucide-react";
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
      icon: DollarSign,
      trend: { value: 12.5, isPositive: true },
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Outstanding",
      value: currencyFormat(baseCurrency, summary.outstandingAmount),
      description: "Awaiting payment",
      icon: Clock,
      trend: { value: 8.2, isPositive: false },
      color: "text-amber-600",
      bgColor: "bg-amber-50",
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
      icon: AlertCircle,
      trend: { value: 3.1, isPositive: false },
      color: "text-red-600",
      bgColor: "bg-red-50",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      title: "Draft",
      value: currencyFormat(baseCurrency, summary.draftAmount),
      description: "Not yet sent",
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Invoice Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track and manage your invoices efficiently
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="bg-[#5B34EA] hover:bg-[#4926D1]">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
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
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
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
                            ? "text-green-600"
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
                    <p className="text-xs text-gray-500">{stat.description}</p>
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
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Paid</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, 0)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    0%
                  </Badge>
                </div>

                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Outstanding</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, summary.outstandingAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
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
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Overdue</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, summary.overdueAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
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
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">Draft</p>
                    <p className="text-2xl font-bold">
                      {currencyFormat(baseCurrency, summary.draftAmount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-gray-50 text-gray-700 border-gray-200"
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
                <Filter className="mr-2 h-4 w-4" />
                Filter
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
                      <tr className="border-b bg-gray-50/50">
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          Invoice
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          Client
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          Amount
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          Status
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          Date
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 5).map((invoice, index) => (
                        <tr
                          key={invoice.id}
                          className="border-b hover:bg-gray-50/50"
                        >
                          <td className="p-3 text-sm font-medium">
                            #{invoice.invoiceNumber}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
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
                                invoice.status === "paid" &&
                                  "bg-green-50 text-green-700 border-green-200",
                                invoice.status === "sent" &&
                                  "bg-blue-50 text-blue-700 border-blue-200",
                                invoice.status === "overdue" &&
                                  "bg-red-50 text-red-700 border-red-200",
                                invoice.status === "draft" &&
                                  "bg-gray-50 text-gray-700 border-gray-200"
                              )}
                            >
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
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
