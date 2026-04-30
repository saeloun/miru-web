import React, { useCallback, useEffect, useState } from "react";
import Loader from "common/Loader/index";
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
import { useSearchParams } from "react-router-dom";
import axios from "../../../apis/api";
import useInfiniteLoadTrigger from "../../../hooks/useInfiniteLoadTrigger";
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
import {
  buildSearchParams,
  formatReportQueryDate,
  parseNumericListParam,
  parseReportQueryDate,
} from "../filterUtils";
import { i18n } from "../../../i18n";
import ViewInAnalyticsButton from "../ViewInAnalyticsButton";

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

const resolvePaymentPreset = (preset: string) => {
  const now = new Date();

  switch (preset) {
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const lastMonth = subDays(startOfMonth(now), 1);

      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "this_quarter":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "this_year":
      return { from: startOfYear(now), to: now };
    case "last_7_days":
      return { from: subDays(now, 7), to: now };
    case "last_30_days":
      return { from: subDays(now, 30), to: now };
    case "custom":
      return undefined;
    default:
      return { from: startOfYear(now), to: now };
  }
};

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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPreset = searchParams.get("preset") || "this_year";
  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");
  const parsedInitialFrom = parseReportQueryDate(initialFrom);
  const parsedInitialTo = parseReportQueryDate(initialTo);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    parsedInitialFrom || parsedInitialTo
      ? {
          from: parsedInitialFrom,
          to: parsedInitialTo,
        }
      : resolvePaymentPreset(initialPreset)
  );

  const [dateRangePreset, setDateRangePreset] = useState(initialPreset);

  const [selectedClients, setSelectedClients] = useState<number[]>(
    parseNumericListParam(searchParams.get("clients"))
  );

  const [paymentMethod, setPaymentMethod] = useState<string>(
    searchParams.get("paymentMethod") || ""
  );

  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || ""
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [visibleRowCount, setVisibleRowCount] = useState(25);

  const { data, isLoading, error, refetch } = useQuery<PaymentReportData>({
    queryKey: [
      "paymentReport",
      dateRange,
      selectedClients,
      paymentMethod,
      statusFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(dateRange?.from && { from: formatReportQueryDate(dateRange.from) }),
        ...(dateRange?.to && { to: formatReportQueryDate(dateRange.to) }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
        ...(paymentMethod && { payment_method: paymentMethod }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await axios.get(
        `/reports/payments?${params.toString()}`
      );

      return response.data;
    },
  });

  useEffect(() => {
    const nextParams = buildSearchParams({
      preset: dateRangePreset,
      from: formatReportQueryDate(dateRange?.from),
      to: formatReportQueryDate(dateRange?.to),
      clients:
        selectedClients.length > 0 ? selectedClients.join(",") : undefined,
      paymentMethod,
      status: statusFilter,
    });

    setSearchParams(nextParams, { replace: true });
  }, [
    dateRange?.from,
    dateRange?.to,
    dateRangePreset,
    paymentMethod,
    selectedClients,
    setSearchParams,
    statusFilter,
  ]);

  useEffect(() => {
    const nextPreset = searchParams.get("preset") || "this_year";
    const nextFrom = parseReportQueryDate(searchParams.get("from"));
    const nextTo = parseReportQueryDate(searchParams.get("to"));
    const nextClients = parseNumericListParam(searchParams.get("clients"));
    const nextPaymentMethod = searchParams.get("paymentMethod") || "";
    const nextStatus = searchParams.get("status") || "";
    const nextDateRange =
      nextFrom || nextTo
        ? { from: nextFrom, to: nextTo || nextFrom }
        : resolvePaymentPreset(nextPreset);

    setDateRangePreset(current =>
      current === nextPreset ? current : nextPreset
    );

    setDateRange(current => {
      const currentFrom = formatReportQueryDate(current?.from);
      const currentTo = formatReportQueryDate(current?.to);
      const nextFromString = formatReportQueryDate(nextDateRange?.from);
      const nextToString = formatReportQueryDate(nextDateRange?.to);

      if (currentFrom === nextFromString && currentTo === nextToString) {
        return current;
      }

      return nextDateRange;
    });

    setSelectedClients(current =>
      current.join(",") === nextClients.join(",") ? current : nextClients
    );

    setPaymentMethod(current =>
      current === nextPaymentMethod ? current : nextPaymentMethod
    );
    setStatusFilter(current => (current === nextStatus ? current : nextStatus));
  }, [searchParams]);

  const analyticsUrl = React.useMemo(() => {
    const params = buildSearchParams({
      preset: dateRangePreset,
      from: formatReportQueryDate(dateRange?.from),
      to: formatReportQueryDate(dateRange?.to),
      clients:
        selectedClients.length > 0 ? selectedClients.join(",") : undefined,
    });

    const queryString = params.toString();

    return queryString
      ? `/analytics/clients?${queryString}`
      : "/analytics/clients";
  }, [dateRange?.from, dateRange?.to, dateRangePreset, selectedClients]);

  const handleDateRangePreset = (preset: string) => {
    setDateRange(resolvePaymentPreset(preset));
    setDateRangePreset(preset);
  };

  const downloadMutation = useMutation({
    mutationFn: async (formatType: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format: formatType,
        ...(dateRange?.from && { from: formatReportQueryDate(dateRange.from) }),
        ...(dateRange?.to && { to: formatReportQueryDate(dateRange.to) }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
        ...(paymentMethod && { payment_method: paymentMethod }),
        ...(statusFilter && { status: statusFilter }),
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
      header: i18n.t("date"),
      cell: ({ row }) => (
        <div className="font-medium">
          {format(new Date(row.getValue("payment_date")), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "client_name",
      header: i18n.t("client"),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("client_name")}</div>
      ),
    },
    {
      accessorKey: "invoice_number",
      header: i18n.t("invoices.invoice"),
      cell: ({ row }) => (
        <div className="text-blue-600 hover:underline cursor-pointer">
          {row.getValue("invoice_number")}
        </div>
      ),
    },
    {
      accessorKey: "payment_method",
      header: i18n.t("reports.paymentMethod"),
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
      header: () => <div className="text-right">{i18n.t("amount")}</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-green-600">
          {currencyFormat(data?.currency, row.getValue("amount"))}
        </div>
      ),
    },
    {
      accessorKey: "notes",
      header: i18n.t("notes"),
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm truncate max-w-[200px]">
          {row.original.notes || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: i18n.t("status"),
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
    return <Loader className="h-64" />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        {i18n.t("reports.unableToLoadPaymentReport")}
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
                {i18n.t("reports.paymentReportTitle")}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {i18n.t("reports.paymentReportDesc")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range Preset Selector */}
              <Select
                value={dateRangePreset}
                onValueChange={handleDateRangePreset}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={i18n.t("selectPeriod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">
                    {i18n.t("thisMonth")}
                  </SelectItem>
                  <SelectItem value="last_month">
                    {i18n.t("lastMonth")}
                  </SelectItem>
                  <SelectItem value="this_quarter">
                    {i18n.t("thisQuarter")}
                  </SelectItem>
                  <SelectItem value="this_year">
                    {i18n.t("thisYear")}
                  </SelectItem>
                  <SelectItem value="last_7_days">
                    {i18n.t("reports.lastSevenDays")}
                  </SelectItem>
                  <SelectItem value="last_30_days">
                    {i18n.t("reports.lastThirtyDaysPreset")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {i18n.t("customRange")}
                  </SelectItem>
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
                      <span>{i18n.t("pickADateRange")}</span>
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
                            ? i18n.t("clients.allClients")
                            : selectedClients.length === 1
                            ? data.filterOptions.clients.find(
                                c => c.id === selectedClients[0]
                              )?.name
                            : i18n.t("reports.clientsSelected", {
                                count: selectedClients.length,
                              })}
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
                          {i18n.t("clients.allClients")}
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
                  <SelectValue placeholder={i18n.t("reports.allMethods")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {i18n.t("reports.allMethods")}
                  </SelectItem>
                  {data?.filterOptions?.paymentMethods?.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  )) || [
                    <SelectItem key="credit_card" value="credit_card">
                      {i18n.t("reports.creditCard")}
                    </SelectItem>,
                    <SelectItem key="bank_transfer" value="bank_transfer">
                      {i18n.t("payments.bankTransfer")}
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
                    {i18n.t("reports.export")}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("csv")}
                  >
                    {i18n.t("reports.exportAsCsv")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadMutation.mutate("pdf")}
                  >
                    {i18n.t("reports.exportAsPdf")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ViewInAnalyticsButton to={analyticsUrl} />
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
                {i18n.t("reports.totalPayments")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currencyFormat(
                  data?.currency,
                  data?.summary?.total_amount || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(
                      dateRange.to,
                      "MMM d, yyyy"
                    )}`
                  : i18n.t("reports.selectedPeriod")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {i18n.t("reports.paymentCount")}
              </CardTitle>
              <Hash className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.summary?.payment_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {i18n.t("reports.totalTransactions")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {i18n.t("reports.averagePayment")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {currencyFormat(
                  data?.currency,
                  data?.summary?.average_payment || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {i18n.t("reports.perTransaction")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {i18n.t("reports.topMethod")}
              </CardTitle>
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
                    data?.currency,
                    Object.entries(data.summary.by_payment_method).sort(
                      ([, a], [, b]) => b - a
                    )[0]?.[1] || 0
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
                <CardTitle>
                  {i18n.t("reports.paymentMethodsBreakdown")}
                </CardTitle>
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
                          {currencyFormat(data?.currency, amount)}
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
            <CardTitle>{i18n.t("reports.paymentDetails")}</CardTitle>
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
                        {i18n.t("reports.noPaymentsFoundForSelectedPeriod")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
              <span>
                {i18n.t("reports.showingPayments", {
                  shown: displayedRows,
                  total: totalRows,
                })}
              </span>
              {hasMoreRows && (
                <span>{i18n.t("reports.scrollToLoadMorePayments")}</span>
              )}
              {hasMoreRows && (
                <div ref={loadMoreRowsRef} className="h-8 w-full" />
              )}
              {!hasMoreRows && totalRows > 0 && (
                <span>{i18n.t("payments.allPaymentsLoaded")}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentReport;
