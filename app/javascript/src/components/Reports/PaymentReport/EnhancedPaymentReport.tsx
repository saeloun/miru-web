import React, { useState } from "react";
import {
  CreditCard,
  CurrencyDollar as DollarSign,
  TrendUp as TrendingUp,
  Download,
  CaretDown as ChevronDown,
  Calendar as CalendarIcon,
  Hash,
  ArrowUp,
  ArrowDown,
  Funnel,
  FileText,
  FileCsv,
  Check,
  X,
  Bank,
  Wallet,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
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
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";
import { DateRange } from "react-day-picker";
import axios from "../../../apis/api";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { cn } from "../../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar as CalendarComponent } from "../../ui/calendar";
import { currencyFormat } from "../../../helpers";
import { motion, AnimatePresence } from "framer-motion";

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

const getPaymentMethodIcon = (method: string) => {
  const methodLower = method.toLowerCase();
  if (methodLower.includes("card") || methodLower.includes("credit")) {
    return <CreditCard className="h-4 w-4" />;
  }

  if (methodLower.includes("bank") || methodLower.includes("ach")) {
    return <Bank className="h-4 w-4" />;
  }

  if (methodLower.includes("paypal") || methodLower.includes("wallet")) {
    return <Wallet className="h-4 w-4" />;
  }

  return <DollarSign className="h-4 w-4" />;
};

const getPaymentMethodColor = (method: string) => {
  const methodLower = method.toLowerCase();
  if (methodLower.includes("card") || methodLower.includes("credit")) {
    return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
  }

  if (methodLower.includes("bank") || methodLower.includes("ach")) {
    return "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white";
  }

  if (methodLower.includes("paypal")) {
    return "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white";
  }

  if (methodLower.includes("stripe")) {
    return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
  }

  return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
};

const EnhancedPaymentReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date(),
  });
  const [dateRangePreset, setDateRangePreset] = useState("this_year");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<PaymentReportData>({
    queryKey: ["paymentReport", dateRange, selectedClients, paymentMethod],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
        ...(paymentMethod && { payment_method: paymentMethod }),
      });

      const response = await axios.get(
        `/reports/payments?${params.toString()}`
      );

      return response.data;
    },
  });

  const handleDateRangePreset = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case "this_month": {
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      }
      case "last_month": {
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      }
      case "this_quarter":
        from = startOfQuarter(now);
        to = endOfQuarter(now);
        break;
      case "this_year":
        from = startOfYear(now);
        to = now;
        break;
      case "last_7_days":
        from = subDays(now, 7);
        to = now;
        break;
      case "last_30_days":
        from = subDays(now, 30);
        to = now;
        break;
      default:
        from = startOfYear(now);
        to = now;
    }

    setDateRange({ from, to });
    setDateRangePreset(preset);
  };

  const handleExport = async (formatType: "csv" | "pdf") => {
    setExportLoading(formatType);

    try {
      const params = new URLSearchParams({
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
        ...(paymentMethod && { payment_method: paymentMethod }),
      });

      if (formatType === "csv") {
        // Generate CSV locally
        const csvContent = generateCSV(data?.payments || []);
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
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
      } else {
        // PDF generation via API
        const response = await axios.get(
          `/reports/payments/download.pdf?${params.toString()}`,
          {
            responseType: "blob",
          }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `payment_report_${format(new Date(), "yyyy-MM-dd")}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExportLoading(null);
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

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "payment_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent font-semibold"
        >
          Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {format(new Date(row.getValue("payment_date")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.getValue("client_name")}
        </div>
      ),
    },
    {
      accessorKey: "invoice_number",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium transition-colors">
          {row.getValue("invoice_number")}
        </div>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Payment Method",
      cell: ({ row }) => {
        const method = row.getValue("payment_method") as string;

        return (
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold",
              getPaymentMethodColor(method)
            )}
          >
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
          className="hover:bg-transparent font-semibold"
        >
          <div className="text-right w-full">Amount</div>
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3 w-3" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold text-emerald-600">
          {currencyFormat(data?.currency, row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <div
          className="text-gray-600 text-sm truncate max-w-[200px]"
          title={row.original.notes}
        >
          {row.original.notes || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isSuccess = status === "completed" || status === "paid";

        return (
          <div
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {isSuccess ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
  ];

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
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Report
              </h3>
              <p className="text-gray-600 mb-4">
                Unable to load payment report. Please try again.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-6 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Payment Analytics
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time insights into your payment transactions
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* Filters with Icons */}
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                <Funnel className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">
                  Filters
                </span>
              </div>

              {/* Date Range Preset */}
              <Select
                value={dateRangePreset}
                onValueChange={handleDateRangePreset}
              >
                <SelectTrigger className="w-[180px] border-gray-200 hover:border-indigo-300 transition-colors">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[260px] justify-start text-left font-normal border-gray-200 hover:border-indigo-300 transition-colors",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-indigo-600" />
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
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={range => {
                      setDateRange(range);
                      setDateRangePreset("custom");
                    }}
                    numberOfMonths={2}
                    disabled={date =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>

              {/* Export Dropdown with Loading States */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transition-all hover:shadow-lg">
                    {exportLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"
                      />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleExport("csv")}
                    disabled={exportLoading === "csv"}
                    className="cursor-pointer hover:bg-indigo-50"
                  >
                    <FileCsv className="mr-2 h-4 w-4 text-green-600" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExport("pdf")}
                    disabled={exportLoading === "pdf"}
                    className="cursor-pointer hover:bg-indigo-50"
                  >
                    <FileText className="mr-2 h-4 w-4 text-red-600" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AnimatePresence>
            {[
              {
                title: "Total Revenue",
                value: currencyFormat(
                  data?.currency,
                  data?.summary?.total_amount || 0
                ),
                icon: DollarSign,
                color: "from-emerald-400 to-emerald-600",
                bgColor: "from-emerald-50 to-emerald-100",
                subtitle:
                  dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM d")} - ${format(
                        dateRange.to,
                        "MMM d, yyyy"
                      )}`
                    : "Selected period",
              },
              {
                title: "Transactions",
                value: data?.summary?.payment_count || 0,
                icon: Hash,
                color: "from-blue-400 to-blue-600",
                bgColor: "from-blue-50 to-blue-100",
                subtitle: "Total payments",
              },
              {
                title: "Average Payment",
                value: currencyFormat(
                  data?.currency,
                  data?.summary?.average_payment || 0
                ),
                icon: TrendingUp,
                color: "from-indigo-400 to-indigo-600",
                bgColor: "from-indigo-50 to-indigo-100",
                subtitle: "Per transaction",
              },
              {
                title: "Top Method",
                value:
                  (data?.summary?.by_payment_method &&
                    Object.entries(data.summary.by_payment_method).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[0]) ||
                  "N/A",
                icon: CreditCard,
                color: "from-purple-400 to-purple-600",
                bgColor: "from-purple-50 to-purple-100",
                subtitle:
                  data?.summary?.by_payment_method &&
                  currencyFormat(
                    data?.currency,
                    Object.entries(data.summary.by_payment_method).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[1] || 0
                  ),
              },
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                      card.bgColor
                    )}
                  />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {card.title}
                    </CardTitle>
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-gradient-to-br",
                        card.color
                      )}
                    >
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {card.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Payment Methods Breakdown */}
        {data?.summary?.by_payment_method &&
          Object.keys(data.summary.by_payment_method).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="mb-8 border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Payment Methods Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(data.summary.by_payment_method).map(
                      ([method, amount], index) => (
                        <motion.div
                          key={method}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  getPaymentMethodColor(method)
                                )}
                              >
                                {getPaymentMethodIcon(method)}
                              </div>
                              <span className="font-medium text-gray-900 capitalize">
                                {method.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-2xl font-bold text-gray-900">
                            {currencyFormat(data?.currency, amount)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {(
                              (amount / (data?.summary?.total_amount || 1)) *
                              100
                            ).toFixed(1)}
                            % of total
                          </div>
                        </motion.div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        {/* Enhanced Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow
                        key={headerGroup.id}
                        className="hover:bg-gray-50"
                      >
                        {headerGroup.headers.map(header => (
                          <TableHead
                            key={header.id}
                            className="font-semibold text-gray-700"
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
                      table.getRowModel().rows.map((row, index) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-colors"
                        >
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id} className="py-4">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          <div className="flex flex-col items-center justify-center py-8">
                            <DollarSign className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">
                              No payments found for the selected period
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {table.getRowModel().rows.length} of{" "}
                  {data?.payments?.length || 0} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: table.getPageCount() },
                      (_, i) => i + 1
                    )
                      .slice(0, 5)
                      .map(page => (
                        <Button
                          key={page}
                          variant={
                            table.getState().pagination.pageIndex === page - 1
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => table.setPageIndex(page - 1)}
                          className={cn(
                            "w-8 h-8 p-0",
                            table.getState().pagination.pageIndex === page - 1
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                              : "hover:bg-indigo-50 hover:border-indigo-300"
                          )}
                        >
                          {page}
                        </Button>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedPaymentReport;
