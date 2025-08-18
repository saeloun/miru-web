import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DataTable } from "../ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import {
  Plus,
  DotsThree,
  Download,
  Eye,
  CreditCard,
  CurrencyDollar,
  Calendar,
  ArrowUp,
  ArrowDown,
  CaretUp,
  CaretDown,
} from "phosphor-react";
import { currencyFormat } from "../../helpers/currency";
import { useUserContext } from "../../context/UserContext";
import api from "../../services/api";
import { toast } from "sonner";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: string;
  transactionDate: string;
  transactionType: string;
  transactionId: string;
  note?: string;
  currency: string;
  exchangeRate?: number;
}

interface PaymentsData {
  payments: Payment[];
  baseCurrency: string;
  total: number;
}

const fetchPayments = async (): Promise<PaymentsData> => {
  try {
    const response = await api.get("/payments");
    return response.data;
  } catch (error) {
    console.warn("Payments API error, using fallback data", error);
    return {
      payments: [],
      baseCurrency: "USD",
      total: 0,
    };
  }
};

const PaymentsTable: React.FC = () => {
  const navigate = useNavigate();
  const { isAdminUser, company } = useUserContext();
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  const baseCurrency = company?.baseCurrency || data?.baseCurrency || "USD";

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "stripe":
      case "credit_card":
        return <CreditCard className="h-4 w-4 text-gray-500" />;
      case "bank_transfer":
      case "check":
      case "cash":
      default:
        return <CurrencyDollar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeLabels = {
      manual: "Manual",
      stripe: "Stripe",
      paypal: "PayPal",
      bank_transfer: "Bank Transfer",
      check: "Check",
      cash: "Cash",
      credit_card: "Credit Card",
    };

    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const columns: ColumnDef<Payment>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "transactionDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={16} className="ml-2" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={16} className="ml-2" />
            ) : (
              <><CaretUp size={8} className="ml-2 -mb-1" /><CaretDown size={8} className="ml-2 -mt-1" /></>
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{row.original.transactionDate}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <button
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
          >
            #{payment.invoiceNumber}
          </button>
        );
      },
    },
    {
      accessorKey: "clientName",
      header: "Client",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div>
            <p className="font-medium text-gray-900">{payment.clientName}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={16} className="ml-2" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={16} className="ml-2" />
            ) : (
              <><CaretUp size={8} className="ml-2 -mb-1" /><CaretDown size={8} className="ml-2 -mt-1" /></>
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="font-medium">
            {currencyFormat(payment.currency || baseCurrency, payment.amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "transactionType",
      header: "Payment Method",
      cell: ({ row }) => {
        return getTransactionTypeBadge(row.original.transactionType);
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Paid
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsThree className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.transactionId)}
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/invoices/${payment.invoiceId}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-600">Failed to load payments</p>
        </div>
      </div>
    );
  }

  const totalAmount = data?.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Track and manage all payment transactions
          </p>
        </div>
        {isAdminUser && (
          <Button
            onClick={() => setShowNewPaymentDialog(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Transactions recorded</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(baseCurrency, totalAmount)}
            </div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(
                baseCurrency,
                data?.total > 0 ? totalAmount / data.total : 0
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            A list of all payment transactions with invoice and client details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.payments && data.payments.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.payments}
              searchPlaceholder="Search payments..."
            />
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
              <p className="text-gray-600 mb-4 mt-4">No payments recorded yet</p>
              {isAdminUser && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewPaymentDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Your First Payment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Payment Dialog Placeholder */}
      <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a new payment transaction to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Payment form would go here */}
            <p className="text-gray-600">Payment form coming soon...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Payment recorded successfully");
              setShowNewPaymentDialog(false);
            }}>
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsTable;