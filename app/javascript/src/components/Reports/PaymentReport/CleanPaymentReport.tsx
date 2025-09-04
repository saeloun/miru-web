import React, { useState } from "react";
import {
  Download,
  CalendarBlank,
  CurrencyDollar,
  CreditCard,
  Bank,
  Wallet,
  CaretDown,
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
import { format } from "date-fns";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { currencyFormat } from "../../../helpers/currency";

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

const CleanPaymentReport: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = useQuery<PaymentReportData>({
    queryKey: ["paymentReport", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(dateRange?.from && { from: format(dateRange.from, "dd/MM/yyyy") }),
        ...(dateRange?.to && { to: format(dateRange.to, "dd/MM/yyyy") }),
      });

      const response = await axios.get(
        `/reports/payments?${params.toString()}`
      );

      return response.data;
    },
  });

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
    const iconClass = "w-4 h-4 text-gray-500";
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
        <span className="text-blue-600 hover:underline cursor-pointer">
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
            "paid": "Paid",
            "partially_paid": "Partially Paid",
            "unpaid": "Unpaid",
            "pending": "Pending",
            "completed": "Completed",
            "success": "Success",
            "failed": "Failed",
            "refunded": "Refunded",
            "cancelled": "Cancelled"
          };
          return statusMap[status.toLowerCase()] || status;
        };
        
        // Determine status color
        const getStatusColor = (status: string) => {
          const lowerStatus = status.toLowerCase();
          if (lowerStatus === "paid" || lowerStatus === "completed" || lowerStatus === "success") {
            return "bg-green-50 text-green-700";
          } else if (lowerStatus === "partially_paid" || lowerStatus === "pending") {
            return "bg-yellow-50 text-yellow-700";
          } else if (lowerStatus === "failed" || lowerStatus === "cancelled") {
            return "bg-red-50 text-red-700";
          } else if (lowerStatus === "refunded") {
            return "bg-gray-50 text-gray-700";
          } else {
            return "bg-gray-50 text-gray-700";
          }
        };

        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(status)}`}
          >
            {formatStatus(status)}
          </span>
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600">Unable to load payment report</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Payment Report
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and analyze your payment transactions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {currencyFormat(
                      data?.currency || "USD",
                      data?.summary?.total_amount || 0
                    )}
                  </p>
                </div>
                <CurrencyDollar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Payments
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {data?.summary?.payment_count || 0}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Average Payment
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {currencyFormat(
                      data?.currency || "USD",
                      data?.summary?.average_payment || 0
                    )}
                  </p>
                </div>
                <Bank className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Success Rate
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    98.5%
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarBlank className="w-4 h-4" />
                  Date Range
                  <CaretDown className="w-4 h-4" />
                </Button>

                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="border-b bg-gray-50/50">
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
                          className="font-medium text-gray-700"
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
                      <TableRow key={row.id} className="hover:bg-gray-50">
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
                        <div className="text-gray-500">No payments found</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data?.payments?.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    data?.payments?.length || 0
                  )}{" "}
                  of {data?.payments?.length || 0} payments
                </p>
                <div className="flex gap-2">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleanPaymentReport;
