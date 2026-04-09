import React, { useCallback, useEffect, useMemo, useState } from "react";
import Loader from "common/Loader/index";
import {
  CurrencyDollar as DollarSign,
  TrendUp as TrendingUp,
  Users,
  Buildings as Building2,
  Download,
  CaretDown as ChevronDown,
  Calendar as CalendarIcon,
} from "@phosphor-icons/react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
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
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { currencyFormat } from "../../../helpers/currency";
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

interface ClientRevenue {
  id: number;
  name: string;
  logo?: string;
  overdue_amount: number;
  outstanding_amount: number;
  paid_amount: number;
  total_revenue: number;
}

interface RevenueReportData {
  clients: ClientRevenue[];
  summary: {
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    totalOverdueAmount: number;
    totalRevenue: number;
  };
  currency: string;
  filterOptions?: {
    clients: Array<{ id: number; name: string }>;
  };
}

const resolveRevenuePreset = (preset: string) => {
  const now = new Date();

  switch (preset) {
    case "all_time":
      return undefined;
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const lastMonth = subDays(startOfMonth(now), 1);

      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "this_quarter":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "last_quarter": {
      const lastQuarter = subDays(startOfQuarter(now), 1);

      return {
        from: startOfQuarter(lastQuarter),
        to: endOfQuarter(lastQuarter),
      };
    }
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last_year": {
      const lastYear = subDays(startOfYear(now), 1);

      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    }
    case "last_30_days":
      return { from: subDays(now, 30), to: now };
    case "custom":
      return undefined;
    default:
      return undefined;
  }
};

const revenueChartConfig = {
  paid_amount: {
    label: "Paid",
    color: "hsl(var(--primary))",
  },
  outstanding_amount: {
    label: "Outstanding",
    color: "hsl(var(--secondary-foreground) / 0.65)",
  },
  overdue_amount: {
    label: "Overdue",
    color: "hsl(var(--destructive))",
  },
};

const RevenueByClientReport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPreset = searchParams.get("preset") || "all_time";
  const initialFrom = parseReportQueryDate(searchParams.get("from"));
  const initialTo = parseReportQueryDate(searchParams.get("to"));
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialFrom || initialTo
      ? { from: initialFrom, to: initialTo || initialFrom }
      : resolveRevenuePreset(initialPreset)
  );
  const [dateRangePreset, setDateRangePreset] = useState(initialPreset);
  const [selectedClients, setSelectedClients] = useState<number[]>(
    parseNumericListParam(searchParams.get("clients"))
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [visibleRowCount, setVisibleRowCount] = useState(25);

  const { data, isLoading, error } = useQuery<RevenueReportData>({
    queryKey: ["revenueByClient", dateRange, selectedClients],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(dateRange?.from && { from: formatReportApiDate(dateRange.from) }),
        ...(dateRange?.to && { to: formatReportApiDate(dateRange.to) }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/client_revenues?${params.toString()}`
      );

      return response.data;
    },
  });

  const handleDateRangePreset = (preset: string) => {
    setDateRangePreset(preset);
    setDateRange(resolveRevenuePreset(preset));
  };

  const downloadMutation = useMutation({
    mutationFn: async (formatType: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format: formatType,
        ...(dateRange?.from && { from: formatReportApiDate(dateRange.from) }),
        ...(dateRange?.to && { to: formatReportApiDate(dateRange.to) }),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/client_revenues/download?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `revenue_by_client_${format(
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

  const revenueChartData = useMemo(
    () => (data?.clients || []).slice(0, 8),
    [data?.clients]
  );

  useEffect(() => {
    setSearchParams(
      buildSearchParams({
        preset: dateRangePreset,
        from: formatReportQueryDate(dateRange?.from),
        to: formatReportQueryDate(dateRange?.to),
        clients: selectedClients.length > 0 ? selectedClients.join(",") : null,
      }),
      { replace: true }
    );
  }, [
    dateRange?.from,
    dateRange?.to,
    dateRangePreset,
    selectedClients,
    setSearchParams,
  ]);

  useEffect(() => {
    const nextPreset = searchParams.get("preset") || "all_time";
    const nextFrom = parseReportQueryDate(searchParams.get("from"));
    const nextTo = parseReportQueryDate(searchParams.get("to"));
    const nextClients = parseNumericListParam(searchParams.get("clients"));
    const nextDateRange =
      nextFrom || nextTo
        ? { from: nextFrom, to: nextTo || nextFrom }
        : resolveRevenuePreset(nextPreset);

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
  }, [searchParams]);

  const columns: ColumnDef<ClientRevenue>[] = [
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.logo && (
            <img
              src={row.original.logo}
              alt=""
              className="w-8 h-8 rounded-full mr-2"
            />
          )}
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "overdue_amount",
      header: () => <div className="text-right">Overdue Amount</div>,
      cell: ({ row }) => (
        <div className="text-right text-red-600 font-medium">
          {currencyFormat(data?.currency, row.getValue("overdue_amount"))}
        </div>
      ),
    },
    {
      accessorKey: "outstanding_amount",
      header: () => <div className="text-right">Outstanding Amount</div>,
      cell: ({ row }) => (
        <div className="text-right text-orange-600 font-medium">
          {currencyFormat(data?.currency, row.getValue("outstanding_amount"))}
        </div>
      ),
    },
    {
      accessorKey: "paid_amount",
      header: () => <div className="text-right">Paid Amount</div>,
      cell: ({ row }) => (
        <div className="text-right text-green-600 font-medium">
          {currencyFormat(data?.currency, row.getValue("paid_amount"))}
        </div>
      ),
    },
    {
      accessorKey: "total_revenue",
      header: () => <div className="text-right">Total Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-indigo-600">
          {currencyFormat(data?.currency, row.getValue("total_revenue"))}
        </div>
      ),
    },
  ];

  useEffect(() => {
    setVisibleRowCount(25);
  }, [data?.clients]);

  const loadMoreRows = useCallback(() => {
    setVisibleRowCount(previousCount => previousCount + 25);
  }, []);

  const totalRows = data?.clients?.length || 0;
  const displayedRows = Math.min(visibleRowCount, totalRows);
  const hasMoreRows = displayedRows < totalRows;

  const loadMoreRowsRef = useInfiniteLoadTrigger({
    enabled: hasMoreRows,
    loading: false,
    onLoadMore: loadMoreRows,
  });

  const table = useReactTable({
    data: data?.clients || [],
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
        Error loading report data. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Revenue by Client
            </h1>

            <div className="flex items-center space-x-3">
              {/* Date Range Preset Selector */}
              <Select
                value={dateRangePreset}
                onValueChange={handleDateRangePreset}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
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
                      <span>All Time</span>
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
                      <DropdownMenuItem onClick={() => setSelectedClients([])}>
                        Clear clients
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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

              <ShareReportButton />
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
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {currencyFormat(
                  data?.currency,
                  data?.summary?.totalRevenue || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(
                      dateRange.to,
                      "MMM d, yyyy"
                    )}`
                  : "All time"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currencyFormat(
                  data?.currency,
                  data?.summary?.totalPaidAmount || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Building2 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {currencyFormat(
                  data?.currency,
                  data?.summary?.totalOutstandingAmount || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {currencyFormat(
                  data?.currency,
                  data?.summary?.totalOverdueAmount || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue Mix by Client</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ChartContainer
                config={revenueChartConfig}
                className="h-[340px] w-full"
              >
                <BarChart
                  data={revenueChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={value =>
                      currencyFormat(data?.currency, Number(value))
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={value =>
                          currencyFormat(data?.currency, Number(value))
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="paid_amount"
                    stackId="revenue"
                    fill="var(--color-paid_amount)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="outstanding_amount"
                    stackId="revenue"
                    fill="var(--color-outstanding_amount)"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="overdue_amount"
                    stackId="revenue"
                    fill="var(--color-overdue_amount)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                No client revenue data available for the selected filters.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Revenue Details</CardTitle>
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
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
              <span>
                Showing {displayedRows} of {totalRows} clients
              </span>
              {hasMoreRows && <span>Scroll to load more clients</span>}
              {hasMoreRows && (
                <div ref={loadMoreRowsRef} className="h-8 w-full" />
              )}
              {!hasMoreRows && totalRows > 0 && <span>All clients loaded</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueByClientReport;
