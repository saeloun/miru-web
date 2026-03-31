import React, { useCallback, useEffect, useMemo, useState } from "react";
import Loader from "common/Loader/index";
import {
  Download,
  CurrencyDollar,
  CreditCard,
  Bank,
  Wallet,
  CaretDown,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useSearchParams } from "react-router-dom";
import axios from "../../../apis/api";
import useInfiniteLoadTrigger from "../../../hooks/useInfiniteLoadTrigger";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarComponent } from "../../ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { currencyFormat } from "../../../helpers/currency";
import { cn } from "../../../lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../ui/chart";
import ShareReportButton from "../ShareReportButton";
import {
  buildSearchParams,
  formatReportApiDate,
  formatReportQueryDate,
  getMultiFilterLabel,
  parseNumericListParam,
  parseReportQueryDate,
  toggleNumberListValue,
} from "../filterUtils";

interface Payment {
  id: number;
  payment_date: string;
  transaction_id: string;
  payment_method: string;
  client_name: string;
  invoice_number: string;
  amount: number;
  notes?: string;
  status: string;
}

interface PaymentReportData {
  payments: Payment[];
  summary: {
    total_amount: number;
    payment_count: number;
    average_payment: number;
    by_payment_method: Record<string, number>;
  };
  currency: string;
  filterOptions?: {
    clients: Array<{ id: number; name: string }>;
    paymentMethods: Array<{ value: string; label: string }>;
  };
}

const paymentMethodChartConfig = {
  total: {
    label: "Amount",
    color: "hsl(var(--primary))",
  },
};

const CleanPaymentReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFrom = parseReportQueryDate(searchParams.get("from"));
  const initialTo = parseReportQueryDate(searchParams.get("to"));
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialFrom || initialTo
      ? { from: initialFrom, to: initialTo || initialFrom }
      : undefined
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isExporting, setIsExporting] = useState(false);
  const [visibleRowCount, setVisibleRowCount] = useState(25);
  const [selectedClients, setSelectedClients] = useState<number[]>(
    parseNumericListParam(searchParams.get("clients"))
  );

  const [paymentMethod, setPaymentMethod] = useState(
    searchParams.get("paymentMethod") || "all"
  );

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  const { data, isLoading, error } = useQuery<PaymentReportData>({
    queryKey: [
      "paymentReport",
      dateRange,
      selectedClients,
      paymentMethod,
      statusFilter,
    ],
    queryFn: async () => {
      const params = buildSearchParams({
        from: formatReportApiDate(dateRange?.from),
        to: formatReportApiDate(dateRange?.to),
        client_ids:
          selectedClients.length > 0 ? selectedClients.join(",") : null,
        payment_method: paymentMethod !== "all" ? paymentMethod : null,
        status: statusFilter !== "all" ? statusFilter : null,
      });

      const response = await axios.get(
        `/reports/payments?${params.toString()}`
      );

      return response.data;
    },
  });

  const paymentMethodChartData = useMemo(
    () =>
      Object.entries(data?.summary?.by_payment_method || {})
        .map(([label, total]) => ({ label, total: Number(total) }))
        .sort((left, right) => right.total - left.total),
    [data?.summary?.by_payment_method]
  );
  const successfulStatuses = ["paid", "completed", "success"];
  const successCount =
    data?.payments?.filter(payment =>
      successfulStatuses.includes(payment.status.toLowerCase())
    ).length || 0;

  const successRate =
    (data?.summary?.payment_count || 0) > 0
      ? ((successCount / (data?.summary?.payment_count || 1)) * 100).toFixed(1)
      : "0.0";

  useEffect(() => {
    setSearchParams(
      buildSearchParams({
        from: formatReportQueryDate(dateRange?.from),
        to: formatReportQueryDate(dateRange?.to),
        clients: selectedClients.length > 0 ? selectedClients.join(",") : null,
        paymentMethod: paymentMethod !== "all" ? paymentMethod : null,
        status: statusFilter !== "all" ? statusFilter : null,
      }),
      { replace: true }
    );
  }, [
    dateRange?.from,
    dateRange?.to,
    paymentMethod,
    selectedClients,
    setSearchParams,
    statusFilter,
  ]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Generate CSV locally
      const csvContent = generateCSV(data?.payments || []);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `payment_report_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (payments: Payment[]) => {
    const headers = [
      "Date",
      "Client",
      "Invoice",
      "Payment Method",
      "Transaction ID",
      "Amount",
      "Status",
      "Notes",
    ];

    const rows = payments.map(payment => [
      format(new Date(payment.payment_date), "yyyy-MM-dd"),
      payment.client_name,
      payment.invoice_number,
      payment.payment_method,
      payment.transaction_id,
      payment.amount.toString(),
      payment.status,
      payment.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  };

  const getPaymentMethodIcon = (method: string) => {
    const iconClass = "h-4 w-4 text-muted-foreground";
    const methodLower = method.toLowerCase();

    if (methodLower.includes("credit") || methodLower.includes("card")) {
      return <CreditCard className={iconClass} />;
    }

    if (methodLower.includes("bank") || methodLower.includes("transfer")) {
      return <Bank className={iconClass} />;
    }

    if (methodLower.includes("paypal") || methodLower.includes("stripe")) {
      return <Wallet className={iconClass} />;
    }

    return <CurrencyDollar className={iconClass} />;
  };

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "payment_date",
      header: "Date",
      cell: ({ row }) =>
        format(new Date(row.getValue("payment_date")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("client_name")}</span>
      ),
    },
    {
      accessorKey: "invoice_number",
      header: "Invoice",
      cell: ({ row }) => (
        <span className="cursor-pointer text-foreground hover:underline">
          {row.getValue("invoice_number")}
        </span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Payment Method",
      cell: ({ row }) => {
        const method = row.getValue("payment_method") as string;

        return (
          <div className="flex items-center gap-2">
            {getPaymentMethodIcon(method)}
            <span>{method}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0"
        >
          Amount
          <CaretDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {currencyFormat(data?.currency || "USD", row.getValue("amount"))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        // Format status for display
        const formatStatus = (status: string) => {
          const statusMap: Record<string, string> = {
            paid: "Paid",
            partially_paid: "Partially Paid",
            unpaid: "Unpaid",
            pending: "Pending",
            completed: "Completed",
            success: "Success",
            failed: "Failed",
            refunded: "Refunded",
            cancelled: "Cancelled",
          };

          return statusMap[status.toLowerCase()] || status;
        };

        // Determine status color
        const getStatusColor = (status: string) => {
          const lowerStatus = status.toLowerCase();
          if (
            lowerStatus === "paid" ||
            lowerStatus === "completed" ||
            lowerStatus === "success"
          ) {
            return "bg-card text-card-foreground border-border";
          } else if (
            lowerStatus === "partially_paid" ||
            lowerStatus === "pending"
          ) {
            return "bg-muted text-foreground border-border";
          } else if (lowerStatus === "failed" || lowerStatus === "cancelled") {
            return "bg-card text-card-foreground border-border";
          } else if (lowerStatus === "refunded") {
            return "bg-card text-card-foreground border-border";
          }

          return "bg-card text-card-foreground border-border";
        };

        return (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {formatStatus(status)}
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    setVisibleRowCount(25);
  }, [data?.payments]);

  const loadMoreRows = useCallback(() => {
    setVisibleRowCount(previousCount => previousCount + 25);
  }, []);

  const totalRows = data?.payments?.length || 0;
  const displayedRows = Math.min(visibleRowCount, totalRows);
  const hasMoreRows = displayedRows < totalRows;

  const loadMoreRowsRef = useInfiniteLoadTrigger({
    enabled: hasMoreRows,
    loading: false,
    onLoadMore: loadMoreRows,
  });

  const table = useReactTable({
    data: data?.payments || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: 0,
        pageSize: visibleRowCount,
      },
    },
  });

  if (isLoading) {
    return <Loader className="h-96" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load payment report</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Payment Report
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track payment flow and collection trends.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {currencyFormat(
                      data?.currency || "USD",
                      data?.summary?.total_amount || 0
                    )}
                  </p>
                </div>
                <CurrencyDollar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Payments
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {data?.summary?.payment_count || 0}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Payment
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {currencyFormat(
                      data?.currency || "USD",
                      data?.summary?.average_payment || 0
                    )}
                  </p>
                </div>
                <Bank className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {successRate}%
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodChartData.length > 0 ? (
              <ChartContainer
                config={paymentMethodChartConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={paymentMethodChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={value =>
                      currencyFormat(data?.currency || "USD", Number(value))
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={value =>
                          currencyFormat(data?.currency || "USD", Number(value))
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment method data available for the selected filters.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex w-full items-center justify-start gap-2 sm:w-[280px]",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "All payment dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      {getMultiFilterLabel(
                        "Clients",
                        selectedClients.length,
                        data?.filterOptions?.clients?.find(client =>
                          selectedClients.includes(client.id)
                        )?.name
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="max-h-80 w-64 overflow-y-auto"
                  >
                    {(data?.filterOptions?.clients || []).map(client => (
                      <DropdownMenuCheckboxItem
                        key={client.id}
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() =>
                          setSelectedClients(previous =>
                            toggleNumberListValue(previous, client.id)
                          )
                        }
                      >
                        {client.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {selectedClients.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSelectedClients([])}
                        >
                          Clear clients
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {(data?.filterOptions?.paymentMethods || []).map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">
                      Partially Paid
                    </SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <ShareReportButton />
                <Button
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2 sm:w-auto"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="border-b bg-muted/40">
            <CardTitle className="text-base font-medium">
              Payment Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          className="font-medium text-foreground"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} className="hover:bg-muted/40">
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-32 text-center"
                      >
                        <div className="text-muted-foreground">
                          No payments found
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data?.payments?.length > 0 && (
              <div className="flex flex-col items-center gap-2 border-t px-4 py-4 text-sm text-muted-foreground sm:px-6">
                <p className="text-sm text-muted-foreground">
                  Showing {displayedRows} of {totalRows} payments
                </p>
                {hasMoreRows && <span>Scroll to load more payments</span>}
                {hasMoreRows && (
                  <div ref={loadMoreRowsRef} className="h-8 w-full" />
                )}
                {!hasMoreRows && totalRows > 0 && (
                  <span>All payments loaded</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleanPaymentReport;
