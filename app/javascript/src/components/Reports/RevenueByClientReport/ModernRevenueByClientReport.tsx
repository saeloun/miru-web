import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { DateRangePicker } from "../../ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { ArrowUpDown, Download, Filter, TrendUp } from "phosphor-react";
import { currencyFormat } from "../../../helpers/currency";
import Loader from "../../../common/Loader";

interface RevenueClient {
  id: number;
  name: string;
  total_revenue: number;
  paid_revenue: number;
  outstanding_revenue: number;
  overdue_revenue: number;
  invoice_count: number;
}

interface Summary {
  total_revenue: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  client_count: number;
}

interface RevenueByClientReportProps {
  data?: RevenueClient[];
  summary?: Summary;
  isLoading?: boolean;
}

const presets = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "Last Quarter", value: "last_quarter" },
  { label: "This Year", value: "this_year" },
  { label: "Last Year", value: "last_year" },
  { label: "All Time", value: "all_time" },
];

export const ModernRevenueByClientReport: React.FC<
  RevenueByClientReportProps
> = ({
  data = [],
  summary = {
    total_revenue: 0,
    total_paid: 0,
    total_outstanding: 0,
    total_overdue: 0,
    client_count: 0,
  },
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedPreset, setSelectedPreset] = useState("all_time");
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<RevenueClient>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Client Name
          <ArrowUpDown size={16} className="ml-2" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "total_revenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Total Revenue
          <ArrowUpDown size={16} className="ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total_revenue"));

        return (
          <div className="text-right font-medium">
            {currencyFormat("USD", amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "paid_revenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Paid Revenue
          <ArrowUpDown size={16} className="ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("paid_revenue"));

        return (
          <div className="text-right font-medium text-green-600">
            {currencyFormat("USD", amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "outstanding_revenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Outstanding
          <ArrowUpDown size={16} className="ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("outstanding_revenue"));

        return (
          <div className="text-right font-medium text-orange-600">
            {currencyFormat("USD", amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "overdue_revenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Overdue
          <ArrowUpDown size={16} className="ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("overdue_revenue"));

        return (
          <div className="text-right font-medium text-red-600">
            {currencyFormat("USD", amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "invoice_count",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Invoices
          <ArrowUpDown size={16} className="ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const count = parseInt(row.getValue("invoice_count"));

        return (
          <div className="text-right">
            <Badge variant="outline">{count}</Badge>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  const handleExport = (format: "csv" | "pdf") => {
    // Implementation for export functionality
    // TODO: Implement export functionality
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Revenue by Client Report
          </h1>
          <p className="text-gray-600 mt-1">
            Track revenue performance across all clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download size={16} className="mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem onClick={() => handleExport("csv")}>
                Export as CSV
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => handleExport("pdf")}>
                Export as PDF
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => navigate("/reports")}>Back to Reports</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendUp size={16} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat("USD", summary.total_revenue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <TrendUp size={16} className="text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currencyFormat("USD", summary.total_paid)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Successfully collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendUp size={16} className="text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {currencyFormat("USD", summary.total_outstanding)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <TrendUp size={16} className="text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currencyFormat("USD", summary.total_overdue)}
            </div>
            <p className="text-xs text-gray-600 mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Clients
            </CardTitle>
            <TrendUp size={16} className="text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.client_count}</div>
            <p className="text-xs text-gray-600 mt-1">With revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range Preset</label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Date Range</label>
              <DateRangePicker
                date={dateRange}
                onSelect={setDateRange}
                placeholder="Select date range"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Clients</label>
              <Input
                placeholder="Filter clients..."
                value={globalFilter ?? ""}
                onChange={event => setGlobalFilter(event.target.value)}
              />
            </div>

            <div className="flex items-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter size={16} className="mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter(column => column.getCanHide())
                    .map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
          <CardDescription>Detailed revenue analysis by client</CardDescription>
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
                      No revenue data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} clients
            </div>
            <div className="flex items-center space-x-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernRevenueByClientReport;
