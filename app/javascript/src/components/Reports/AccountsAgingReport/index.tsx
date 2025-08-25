import React, { useState } from "react";
import {
  AlertCircle,
  Calendar,
  DollarSign,
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
import { format } from "date-fns";
import axios from "../../../apis/api";
import { Button } from "../../ui/button";

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

interface AccountAging {
  id: number;
  client_name: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  amount_due: number;
  current: number;
  "1_30_days": number;
  "31_60_days": number;
  "61_90_days": number;
  over_90_days: number;
}

interface AccountsAgingData {
  invoices: AccountAging[];
  summary: {
    total: number;
    current: number;
    "1_30_days": number;
    "31_60_days": number;
    "61_90_days": number;
    over_90_days: number;
  };
  currency: string;
}

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const AccountsAgingReport: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const { data, isLoading, error } = useQuery<AccountsAgingData>({
    queryKey: ["accountsAging", asOfDate, selectedClients],
    queryFn: async () => {
      const params = new URLSearchParams({
        as_of_date: format(asOfDate, "dd/MM/yyyy"),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/accounts_aging?${params.toString()}`
      );

      return response.data;
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (formatType: "csv" | "pdf") => {
      const params = new URLSearchParams({
        format: formatType,
        as_of_date: format(asOfDate, "dd/MM/yyyy"),
        ...(selectedClients.length > 0 && {
          client_ids: selectedClients.join(","),
        }),
      });

      const response = await axios.get(
        `/reports/accounts_aging/download?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `accounts_aging_${format(
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

  const columns: ColumnDef<AccountAging>[] = [
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("client_name")}</div>
      ),
    },
    {
      accessorKey: "amount_due",
      header: () => <div className="text-right">Total Due</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold whitespace-nowrap">
          {formatCurrency(row.getValue("amount_due"), data?.currency)}
        </div>
      ),
    },
    {
      accessorKey: "1_30_days",
      header: () => (
        <div className="text-right whitespace-nowrap">1-30 Days</div>
      ),
      cell: ({ row }) => {
        const value = row.getValue("1_30_days") as number;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {formatCurrency(value || 0, data?.currency)}
          </div>
        );
      },
    },
    {
      accessorKey: "31_60_days",
      header: () => (
        <div className="text-right whitespace-nowrap">31-60 Days</div>
      ),
      cell: ({ row }) => {
        const value = row.getValue("31_60_days") as number;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {formatCurrency(value || 0, data?.currency)}
          </div>
        );
      },
    },
    {
      accessorKey: "61_90_days",
      header: () => (
        <div className="text-right whitespace-nowrap">61-90 Days</div>
      ),
      cell: ({ row }) => {
        const value = row.getValue("61_90_days") as number;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {formatCurrency(value || 0, data?.currency)}
          </div>
        );
      },
    },
    {
      accessorKey: "over_90_days",
      header: () => (
        <div className="text-right whitespace-nowrap">90+ Days</div>
      ),
      cell: ({ row }) => {
        const value = row.getValue("over_90_days") as number;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-900 font-bold" : "text-gray-300"
            )}
          >
            {formatCurrency(value || 0, data?.currency)}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.invoices || [],
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
    <div className="space-y-6 p-4 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Accounts Aging Report
          </h1>
          <p className="text-gray-600 mt-1">
            Analysis of outstanding receivables by aging period
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* As of Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal bg-white",
                  !asOfDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                As of {format(asOfDate, "LLL dd, y")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={asOfDate}
                onSelect={date => date && setAsOfDate(date)}
                initialFocus
                disabled={date => date > new Date()}
              />
            </PopoverContent>
          </Popover>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadMutation.mutate("csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadMutation.mutate("pdf")}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data?.summary?.total || 0, data?.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1-30 Days</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-700">
              {formatCurrency(
                data?.summary?.["1_30_days"] || 0,
                data?.currency
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">31-60 Days</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-700">
              {formatCurrency(
                data?.summary?.["31_60_days"] || 0,
                data?.currency
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">61-90 Days</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-700" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-800">
              {formatCurrency(
                data?.summary?.["61_90_days"] || 0,
                data?.currency
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90+ Days</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(
                data?.summary?.["over_90_days"] || 0,
                data?.currency
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aging Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Invoice Aging Details</CardTitle>
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
                      No outstanding invoices.
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
  );
};

export default AccountsAgingReport;
