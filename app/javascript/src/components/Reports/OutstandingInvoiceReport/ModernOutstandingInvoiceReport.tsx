import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  CaretRight,
  CaretDown,
  Download,
  Receipt,
  Warning,
  Clock,
  CurrencyDollar,
  Buildings,
  Calendar,
  CaretUp,
  ArrowUp,
  ArrowDown,
  FileText,
  Eye,
  Envelope,
} from "phosphor-react";
import { cn } from "../../../lib/utils";
import { currencyFormat } from "../../../helpers/currency";
import { useUserContext } from "../../../context/UserContext";
import invoicesApi from "../../../apis/invoices";
import { DateRangePicker } from "../../ui/date-range-picker";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client?: {
    id: string;
    name: string;
    logo?: string;
  };
  amount: number;
  amount_due: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
  status: "sent" | "viewed" | "overdue";
  currency: string;
}

interface ClientGroup {
  client_id: string;
  client_name: string;
  client_logo?: string;
  invoices: Invoice[];
  total_outstanding: number;
  total_overdue: number;
}

const fetchOutstandingInvoices = async (filters: any = {}) => {
  // Build query params for filtering invoices
  const queryParams = new URLSearchParams();

  // Filter for outstanding and overdue statuses
  queryParams.append("status[]", "sent");
  queryParams.append("status[]", "viewed");
  queryParams.append("status[]", "overdue");

  // Add client filters if provided
  if (filters.client_ids && filters.client_ids.length > 0) {
    filters.client_ids.forEach((clientId: string) => {
      queryParams.append("client_ids[]", clientId);
    });
  }

  // Add date range filters if provided
  if (filters.dateRange) {
    if (filters.dateRange.from) {
      queryParams.append(
        "from_date",
        format(filters.dateRange.from, "yyyy-MM-dd")
      );
    }
    if (filters.dateRange.to) {
      queryParams.append("to_date", format(filters.dateRange.to, "yyyy-MM-dd"));
    }
  }

  // Fetch all invoices without pagination
  queryParams.append("per", "1000");

  const response = await invoicesApi.get(queryParams.toString());
  const invoices = response.data.invoices || [];

  // Group invoices by client
  const clientsMap = new Map<string, ClientGroup>();

  invoices.forEach((invoice: Invoice) => {
    const clientId = invoice.client_id;
    const clientName =
      invoice.client_name || invoice.client?.name || "Unknown Client";

    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        client_id: clientId,
        client_name: clientName,
        client_logo: invoice.client?.logo,
        invoices: [],
        total_outstanding: 0,
        total_overdue: 0,
      });
    }

    const client = clientsMap.get(clientId)!;
    client.invoices.push(invoice);

    // Calculate amounts using amount_due
    const amountDue = parseFloat(
      String(invoice.amount_due || invoice.amount || 0)
    );

    if (invoice.status === "overdue") {
      client.total_overdue += amountDue;
    } else if (["sent", "viewed"].includes(invoice.status)) {
      client.total_outstanding += amountDue;
    }
  });

  // Convert to array and sort by client name
  const clientsList = Array.from(clientsMap.values()).sort((a, b) =>
    a.client_name.localeCompare(b.client_name)
  );

  // Calculate summary
  const summary = {
    total_invoices: invoices.length,
    total_amount: invoices.reduce(
      (sum: number, inv: Invoice) =>
        sum + parseFloat(String(inv.amount_due || inv.amount || 0)),
      0
    ),
    total_outstanding: invoices
      .filter((inv: Invoice) => ["sent", "viewed"].includes(inv.status))
      .reduce(
        (sum: number, inv: Invoice) =>
          sum + parseFloat(String(inv.amount_due || inv.amount || 0)),
        0
      ),
    total_overdue: invoices
      .filter((inv: Invoice) => inv.status === "overdue")
      .reduce(
        (sum: number, inv: Invoice) =>
          sum + parseFloat(String(inv.amount_due || inv.amount || 0)),
        0
      ),
  };

  return {
    clients: clientsList,
    summary,
    currency: response.data.summary?.currency || "USD",
  };
};

const ModernOutstandingInvoiceReport: React.FC = () => {
  const { company } = useUserContext();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["outstanding-invoices", dateRange, selectedClients],
    queryFn: () =>
      fetchOutstandingInvoices({
        dateRange,
        client_ids: selectedClients,
      }),
  });

  const baseCurrency = data?.currency || company?.baseCurrency || "USD";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Envelope className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "viewed":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Eye className="w-3 h-3 mr-1" />
            Viewed
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <Warning className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<ClientGroup>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.toggleExpanded()}
            className="p-0 h-8 w-8"
          >
            {row.getIsExpanded() ? (
              <CaretDown className="h-4 w-4" />
            ) : (
              <CaretRight className="h-4 w-4" />
            )}
          </Button>
        ) : null;
      },
    },
    {
      accessorKey: "client_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Client
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : (
            <>
              <CaretUp size={8} className="ml-2 -mb-1" />
              <CaretDown size={8} className="ml-2 -mt-1" />
            </>
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center gap-3">
            <Buildings className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{client.client_name}</p>
              <p className="text-sm text-gray-500">
                {client.invoices.length} invoice
                {client.invoices.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "total_outstanding",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Outstanding
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : (
            <>
              <CaretUp size={8} className="ml-2 -mb-1" />
              <CaretDown size={8} className="ml-2 -mt-1" />
            </>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {currencyFormat(baseCurrency, row.original.total_outstanding)}
        </div>
      ),
    },
    {
      accessorKey: "total_overdue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Overdue
          {column.getIsSorted() === "asc" ? (
            <ArrowUp size={16} className="ml-2" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown size={16} className="ml-2" />
          ) : (
            <>
              <CaretUp size={8} className="ml-2 -mb-1" />
              <CaretDown size={8} className="ml-2 -mt-1" />
            </>
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.original.total_overdue;
        return (
          <div className={cn("font-medium", amount > 0 && "text-red-600")}>
            {currencyFormat(baseCurrency, amount)}
          </div>
        );
      },
    },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => {
        const total =
          row.original.total_outstanding + row.original.total_overdue;
        return (
          <div className="font-semibold">
            {currencyFormat(baseCurrency, total)}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.clients || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      expanded,
    },
    getSubRows: row => row.invoices as any,
  });

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      // Implementation for export
      console.log(`Exporting as ${format}`);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Warning size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Failed to load report data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Outstanding & Overdue Invoices
          </h1>
          <p className="text-gray-600 mt-1">
            Track unpaid invoices and overdue payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.summary.total_invoices || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Active invoices</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {currencyFormat(
                    baseCurrency,
                    data?.summary.total_amount || 0
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">Unpaid amount</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {currencyFormat(
                    baseCurrency,
                    data?.summary.total_outstanding || 0
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">Not yet due</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Warning className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {currencyFormat(
                    baseCurrency,
                    data?.summary.total_overdue || 0
                  )}
                </div>
                <p className="text-xs text-red-600 mt-1">Requires attention</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Invoice Details by Client</CardTitle>
          <CardDescription>
            Click on a client to view their individual invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
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
                    table.getRowModel().rows.map(row => {
                      const isInvoice = row.depth > 0;

                      if (isInvoice) {
                        const invoice = row.original as unknown as Invoice;
                        return (
                          <TableRow
                            key={row.id}
                            className="bg-gray-50 hover:bg-gray-100"
                          >
                            <TableCell className="pl-12" colSpan={2}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="font-medium">
                                    #{invoice.invoice_number}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Due: {invoice.due_date}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(invoice.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {currencyFormat(
                                  baseCurrency,
                                  invoice.amount_due || invoice.amount
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    View Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Send Reminder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Download PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className={row.getIsExpanded() ? "border-b-0" : ""}
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
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No outstanding or overdue invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernOutstandingInvoiceReport;
