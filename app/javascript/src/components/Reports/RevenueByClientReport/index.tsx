import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Download,
  ChevronDown,
  CalendarIcon,
} from "lucide-react";
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
  endOfYear,
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
import { formatCurrency } from "../../../utils/currency";

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
}

const RevenueByClientReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateRangePreset, setDateRangePreset] = useState("all_time");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const { data, isLoading, error } = useQuery<RevenueReportData>({
    queryKey: ["revenueByClient", dateRange, selectedClients],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
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
    if (preset === "all_time") {
      setDateRange(undefined);
      setDateRangePreset(preset);

      return;
    }

    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case "this_month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "last_month": {
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      }
      case "this_quarter": {
        from = startOfQuarter(now);
        to = endOfQuarter(now);
        break;
      }
      case "last_quarter": {
        const lastQuarter = subDays(startOfQuarter(now), 1);
        from = startOfQuarter(lastQuarter);
        to = endOfQuarter(lastQuarter);
        break;
      }
      case "this_year": {
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      }
      case "last_year": {
        const lastYear = subDays(startOfYear(now), 1);
        from = startOfYear(lastYear);
        to = endOfYear(lastYear);
        break;
      }
      case "last_30_days": {
        from = subDays(now, 30);
        to = now;
        break;
      }
      default:
        from = startOfMonth(now);
        to = endOfMonth(now);
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
          {formatCurrency(row.getValue("overdue_amount"), data?.currency)}
        </div>
      ),
    },
    {
      accessorKey: "outstanding_amount",
      header: () => <div className="text-right">Outstanding Amount</div>,
      cell: ({ row }) => (
        <div className="text-right text-orange-600 font-medium">
          {formatCurrency(row.getValue("outstanding_amount"), data?.currency)}
        </div>
      ),
    },
    {
      accessorKey: "paid_amount",
      header: () => <div className="text-right">Paid Amount</div>,
      cell: ({ row }) => (
        <div className="text-right text-green-600 font-medium">
          {formatCurrency(row.getValue("paid_amount"), data?.currency)}
        </div>
      ),
    },
    {
      accessorKey: "total_revenue",
      header: () => <div className="text-right">Total Revenue</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-indigo-600">
          {formatCurrency(row.getValue("total_revenue"), data?.currency)}
        </div>
      ),
    },
  ];

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
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(
                  data?.summary?.totalRevenue || 0,
                  data?.currency
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
                {formatCurrency(
                  data?.summary?.totalPaidAmount || 0,
                  data?.currency
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
                {formatCurrency(
                  data?.summary?.totalOutstandingAmount || 0,
                  data?.currency
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
                {formatCurrency(
                  data?.summary?.totalOverdueAmount || 0,
                  data?.currency
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

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

export default RevenueByClientReport;
