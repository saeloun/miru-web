import React, { useState } from "react";
import {
  CreditCard,
  CurrencyDollar as DollarSign,
  TrendUp as TrendingUp,
  Download,
  CaretDown as ChevronDown,
  Calendar as CalendarIcon,
  Hash,
} from "@phosphor-icons/react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { StatusBadge } from "../../ui/status-badge";
import { currencyFormat } from "../../../helpers";

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

  return <DollarSign className="h-4 w-4" />;
};

const getPaymentMethodColor = (method: string) => {
  const methodLower = method.toLowerCase();
  if (methodLower.includes("card") || methodLower.includes("credit")) {
    return "text-blue-600";
  }

  if (methodLower.includes("bank") || methodLower.includes("ach")) {
    return "text-green-600";
  }

  if (methodLower.includes("paypal")) {
    return "text-indigo-600";
  }

  if (methodLower.includes("stripe")) {
    return "text-purple-600";
  }

  return "text-gray-600";
};

const PaymentReport: React.FC = () => {
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

  const downloadMutation = useMutation({
    mutationFn: async (formatType: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format: formatType,
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
        ...(paymentMethod && { payment_method: paymentMethod }),
      });

      const response = await axios.get(
        `/reports/payments/download?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `payment_report_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.${formatType}`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "payment_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="font-medium">
          {format(new Date(row.getValue("payment_date")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("client_name")}</div>
      ),
    },
    {
      accessorKey: "invoice_number",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="text-blue-600 hover:underline cursor-pointer">
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
              "flex items-center gap-2",
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
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-green-600">
          {currencyFormat(row.getValue("amount"), data?.currency)}
        </div>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm truncate max-w-[200px]">
          {row.original.notes || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        return (
          <StatusBadge
            status={status === "completed" ? "paid" : status}
            className="capitalize"
          />
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error loading payment report. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Payment Report
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track and analyze all payment transactions
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Preset Selector */}
              <Select
                value={dateRangePreset}
                onValueChange={handleDateRangePreset}
              >
                <SelectTrigger className="w-[180px]">
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

              {/* Custom Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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

              {/* Client Filter */}
              {data?.filterOptions?.clients &&
                data.filterOptions.clients.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-between"
                      >
                        <span className="truncate">
                          {selectedClients.length === 0
                            ? "All Clients"
                            : selectedClients.length === 1
                            ? data.filterOptions.clients.find(
                                c => c.id === selectedClients[0]
                              )?.name
                            : `${selectedClients.length} clients`}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setSelectedClients([])}
                        >
                          All Clients
                        </Button>
                        {data.filterOptions.clients.map(client => (
                          <Button
                            key={client.id}
                            variant={
                              selectedClients.includes(client.id)
                                ? "secondary"
                                : "ghost"
                            }
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedClients(
                                selectedClients.includes(client.id)
                                  ? selectedClients.filter(
                                      id => id !== client.id
                                    )
                                  : [...selectedClients, client.id]
                              );
                            }}
                          >
                            {client.name}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

              {/* Payment Method Filter */}
              <Select
                value={paymentMethod || "all"}
                onValueChange={value =>
                  setPaymentMethod(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {data?.filterOptions?.paymentMethods?.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  )) || [
                    <SelectItem key="credit_card" value="credit_card">
                      Credit Card
                    </SelectItem>,
                    <SelectItem key="bank_transfer" value="bank_transfer">
                      Bank Transfer
                    </SelectItem>,
                    <SelectItem key="paypal" value="paypal">
                      PayPal
                    </SelectItem>,
                    <SelectItem key="stripe" value="stripe">
                      Stripe
                    </SelectItem>,
                  ]}
                </SelectContent>
              </Select>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("csv")}
                  >
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("pdf")}
                  >
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payments
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currencyFormat(
                  data?.summary?.total_amount || 0,
                  data?.currency
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(
                      dateRange.to,
                      "MMM d, yyyy"
                    )}`
                  : "Selected period"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Count
              </CardTitle>
              <Hash className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.summary?.payment_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Payment
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {currencyFormat(
                  data?.summary?.average_payment || 0,
                  data?.currency
                )}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Method</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">
                {(data?.summary?.by_payment_method &&
                  Object.entries(data.summary.by_payment_method).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[0]) ||
                  "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.summary?.by_payment_method &&
                  currencyFormat(
                    Object.entries(data.summary.by_payment_method).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[1] || 0,
                    data?.currency
                  )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Breakdown */}
        {data?.summary?.by_payment_method &&
          Object.keys(data.summary.by_payment_method).length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Methods Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.summary.by_payment_method).map(
                    ([method, amount]) => (
                      <div
                        key={method}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            getPaymentMethodColor(method)
                          )}
                        >
                          {getPaymentMethodIcon(method)}
                          <span className="font-medium capitalize">
                            {method.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="font-bold">
                          {currencyFormat(amount, data?.currency)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
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
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
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
                        className="h-24 text-center"
                      >
                        No payments found for the selected period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentReport;
