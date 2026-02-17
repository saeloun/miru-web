import React, { useState, useEffect, useRef } from "react";
import {
  Warning as AlertCircle,
  Calendar,
  CurrencyDollar as DollarSign,
  Download,
  CaretDown as ChevronDown,
  Calendar as CalendarIcon,
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
import { currencyFormat } from "../../../helpers/currency";

interface ClientAging {
  id: number;
  name: string;
  logo: string | null;
  amount_overdue: {
    zero_to_thirty_days: number;
    thirty_one_to_sixty_days: number;
    sixty_one_to_ninety_days: number;
    ninety_plus_days: number;
    total: number;
  };
}

interface AccountsAgingData {
  report: {
    clients: ClientAging[];
    total_amount_overdue: {
      zero_to_thirty_days: number;
      thirty_one_to_sixty_days: number;
      sixty_one_to_ninety_days: number;
      ninety_plus_days: number;
      total: number;
    };
    base_currency: string;
  };
}

const AccountsAgingReport: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [displayedItems, setDisplayedItems] = useState(10);
  const tableRef = useRef<HTMLDivElement>(null);

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

  const columns: ColumnDef<ClientAging>[] = [
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "amount_overdue.total",
      header: () => <div className="text-right">Total Due</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold whitespace-nowrap">
          {currencyFormat(
            data?.report?.base_currency,
            row.original.amount_overdue.total
          )}
        </div>
      ),
    },
    {
      accessorKey: "amount_overdue.zero_to_thirty_days",
      header: () => (
        <div className="text-right whitespace-nowrap">0-30 Days</div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.zero_to_thirty_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount_overdue.thirty_one_to_sixty_days",
      header: () => (
        <div className="text-right whitespace-nowrap">31-60 Days</div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.thirty_one_to_sixty_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount_overdue.sixty_one_to_ninety_days",
      header: () => (
        <div className="text-right whitespace-nowrap">61-90 Days</div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.sixty_one_to_ninety_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-700 font-medium" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
    {
      accessorKey: "amount_overdue.ninety_plus_days",
      header: () => (
        <div className="text-right whitespace-nowrap">90+ Days</div>
      ),
      cell: ({ row }) => {
        const value = row.original.amount_overdue.ninety_plus_days;

        return (
          <div
            className={cn(
              "text-right whitespace-nowrap",
              value > 0 ? "text-gray-900 font-bold" : "text-gray-300"
            )}
          >
            {currencyFormat(data?.report?.base_currency, value || 0)}
          </div>
        );
      },
    },
  ];

  // Slice data for infinite scroll
  const allClients = data?.report?.clients || [];
  const visibleClients = allClients.slice(0, displayedItems);

  const table = useReactTable({
    data: visibleClients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableRef.current;
        if (
          scrollTop + clientHeight >= scrollHeight - 100 &&
          displayedItems < allClients.length
        ) {
          setDisplayedItems(prev => Math.min(prev + 10, allClients.length));
        }
      }
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", handleScroll);

      return () => tableElement.removeEventListener("scroll", handleScroll);
    }
  }, [displayedItems, allClients.length]);

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
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.total || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">0-30 Days</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-700">
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.zero_to_thirty_days || 0
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
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.thirty_one_to_sixty_days ||
                  0
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
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.sixty_one_to_ninety_days ||
                  0
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
              {currencyFormat(
                data?.report?.base_currency,
                data?.report?.total_amount_overdue?.ninety_plus_days || 0
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
          <div
            ref={tableRef}
            className="rounded-md border max-h-[600px] overflow-y-auto"
          >
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
                      No clients with outstanding balances.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Loading indicator for infinite scroll */}
          {displayedItems < allClients.length && (
            <div className="flex justify-center py-4">
              <div className="text-sm text-muted-foreground">
                Showing {displayedItems} of {allClients.length} clients...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsAgingReport;
