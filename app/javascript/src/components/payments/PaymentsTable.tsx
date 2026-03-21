import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import Loader from "common/Loader/index";
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
import { payment, paymentsApi } from "apis/api";
import { toast } from "sonner";
import { unmapPayment } from "../../mapper/mappedIndex";
import AddManualEntry from "./Modals/AddManualEntry";

interface Payment {
  id: string | number;
  invoiceId: string | number | null;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
  transactionDate: string;
  transactionType: string;
  transactionId: string;
  note?: string;
  currency: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
}

interface PaymentsData {
  payments: Payment[];
  baseCurrency: string;
  total: number;
}

const normalizeTransactionType = (transactionType: string = "") => {
  if (transactionType === "cheque") return "check";

  return transactionType;
};

const normalizePayment = (payment: any, baseCurrency: string): Payment => ({
  id: payment.id,
  invoiceId: payment.invoiceId ?? payment.invoice_id ?? null,
  invoiceNumber: payment.invoiceNumber ?? payment.invoice_number ?? "N/A",
  clientName: payment.clientName ?? payment.client_name ?? "Unknown Client",
  amount: Number(payment.amount ?? 0),
  status: String(payment.status ?? "paid"),
  transactionDate: payment.transactionDate ?? payment.transaction_date ?? "N/A",
  transactionType: normalizeTransactionType(
    payment.transactionType ?? payment.transaction_type ?? "manual"
  ),
  transactionId: String(
    payment.transactionId ??
      payment.transaction_id ??
      `PAY-${payment.id ?? "N/A"}`
  ),
  note: payment.note ?? "",
  currency:
    payment.currency ??
    payment.paymentCurrency ??
    payment.payment_currency ??
    baseCurrency,
  exchangeRate: payment.exchangeRate ?? payment.exchange_rate,
  baseCurrencyAmount:
    payment.baseCurrencyAmount ?? payment.base_currency_amount,
});

const fetchPayments = async (): Promise<PaymentsData> => {
  try {
    const response = await paymentsApi.get("");
    const baseCurrency =
      response.data.baseCurrency || response.data.base_currency || "USD";

    const payments = (response.data.payments || []).map(payment =>
      normalizePayment(payment, baseCurrency)
    );

    return {
      payments,
      baseCurrency,
      total: response.data.total ?? payments.length,
    };
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
  const queryClient = useQueryClient();
  const { isAdminUser, company } = useUserContext();
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState<any>([]);
  const [dateFormat, setDateFormat] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  const fetchInvoiceList = async () => {
    const { data } = await payment.getInvoiceList();
    const sanitized = await unmapPayment(data);
    setInvoiceList(sanitized);
    setDateFormat(data.company.dateFormat);
  };

  const fetchPaymentList = async () => {
    await queryClient.invalidateQueries({ queryKey: ["payments"] });
  };

  const openManualEntry = async () => {
    try {
      await fetchInvoiceList();
      setShowManualEntryModal(true);
    } catch (e) {
      toast.error("Failed to load invoices for payment entry");
    }
  };

  const baseCurrency = company?.baseCurrency || data?.baseCurrency || "USD";

  const getTransactionTypeBadge = (type: string) => {
    const typeLabels = {
      manual: "Manual",
      stripe: "Stripe",
      paypal: "PayPal",
      bank_transfer: "Bank Transfer",
      check: "Check",
      ach: "ACH",
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "Amex",
      debit_card: "Debit Card",
      cash: "Cash",
      credit_card: "Credit Card",
    };

    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case "failed":
      case "cancelled":
        return "bg-card text-card-foreground border-border";
      case "partially_paid":
        return "bg-muted text-foreground border-border";
      default:
        return "bg-card text-card-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) =>
    status.replaceAll("_", " ").replace(/\b\w/g, s => s.toUpperCase());

  const columns: ColumnDef<Payment>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "transactionDate",
      header: ({ column }) => (
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
            <>
              <CaretUp size={8} className="ml-2 -mb-1" />
              <CaretDown size={8} className="ml-2 -mt-1" />
            </>
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.transactionDate}</span>
        </div>
      ),
    },
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => {
        const payment = row.original;

        if (!payment.invoiceId) {
          return (
            <span className="font-medium text-muted-foreground">
              #{payment.invoiceNumber}
            </span>
          );
        }

        return (
          <button
            className="font-medium text-primary hover:underline"
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
            <p className="font-medium text-foreground">{payment.clientName}</p>
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
          className="-ml-4"
        >
          Amount
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
        const payment = row.original;

        return (
          <div className="font-medium">
            {currencyFormat(payment.currency || baseCurrency, payment.amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Notes",
      cell: ({ row }) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          {row.original.note || "—"}
        </span>
      ),
    },
    {
      accessorKey: "transactionType",
      header: "Payment Method",
      cell: ({ row }) => getTransactionTypeBadge(row.original.transactionType),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={getStatusBadgeClassName(row.original.status)}
        >
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
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
                onClick={() =>
                  navigator.clipboard.writeText(payment.transactionId)
                }
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {payment.invoiceId && (
                <DropdownMenuItem
                  onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View invoice
                </DropdownMenuItem>
              )}
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
    return <Loader className="h-96" />;
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Failed to load payments</p>
        </div>
      </div>
    );
  }

  const totalAmount =
    data?.payments?.reduce(
      (sum, payment) =>
        sum + Number(payment.baseCurrencyAmount ?? payment.amount),
      0
    ) || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground md:text-base">
            Stripe and manual entries in one simple ledger.
          </p>
        </div>
        {isAdminUser && (
          <Button
            onClick={openManualEntry}
            className="bg-foreground text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add manual entry
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collected
            </CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(baseCurrency, totalAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Payment
            </CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(
                baseCurrency,
                data?.total > 0 ? totalAmount / data.total : 0
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Every payment with invoice and client details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.payments && data.payments.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.payments}
              searchPlaceholder="Search by invoice, client, method, or notes..."
            />
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mb-4 mt-4 text-muted-foreground">
                No payments recorded yet
              </p>
              {isAdminUser && (
                <Button variant="outline" onClick={openManualEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual Entry
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showManualEntryModal && (
        <AddManualEntry
          baseCurrency={baseCurrency}
          dateFormat={dateFormat}
          fetchInvoiceList={fetchInvoiceList}
          fetchPaymentList={fetchPaymentList}
          invoiceList={invoiceList}
          setShowManualEntryModal={setShowManualEntryModal}
          showManualEntryModal={showManualEntryModal}
        />
      )}
    </div>
  );
};

export default PaymentsTable;
