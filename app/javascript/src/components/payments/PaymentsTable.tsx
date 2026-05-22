import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import Loader from "common/Loader/index";
import useInfiniteLoadTrigger from "../../hooks/useInfiniteLoadTrigger";
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
  Copy,
} from "phosphor-react";
import { currencyFormat } from "../../helpers/currency";
import { useUserContext } from "../../context/UserContext";
import { payment, paymentsApi } from "apis/api";
import { toast } from "sonner";
import { unmapPayment } from "../../mapper/mappedIndex";
import AddManualEntry from "./Modals/AddManualEntry";
import { i18n } from "../../i18n";

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
  razorpayPayout?: {
    id: string | number;
    externalId?: string;
    status: string;
    triggeredBy: string;
    failureReason?: string;
    recipientUpiId?: string;
  };
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
  razorpayPayout: payment.razorpayPayout ?? payment.razorpay_payout,
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
  const PAYMENTS_BATCH_SIZE = 25;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdminUser, company } = useUserContext();
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState<any>([]);
  const [dateFormat, setDateFormat] = useState("");
  const [withdrawingPaymentId, setWithdrawingPaymentId] = useState<
    string | number | null
  >(null);

  const [visiblePaymentCount, setVisiblePaymentCount] =
    useState(PAYMENTS_BATCH_SIZE);

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
      toast.error(i18n.t("payments.failedToLoadInvoicesForPaymentEntry"));
    }
  };

  const withdrawRazorpayPayment = async (payment: Payment) => {
    try {
      setWithdrawingPaymentId(payment.id);
      await paymentsApi.withdraw(payment.id);
      toast.success(i18n.t("payments.razorpayWithdrawalQueued"));
      await fetchPaymentList();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          i18n.t("payments.razorpayWithdrawalFailed")
      );
    } finally {
      setWithdrawingPaymentId(null);
    }
  };

  const copySelectedTransactionIds = async (selectedPayments: Payment[]) => {
    const transactionIds = selectedPayments
      .map(payment => payment.transactionId)
      .filter(Boolean);

    try {
      await navigator.clipboard.writeText(transactionIds.join("\n"));
      toast.success(
        i18n.t("payments.transactionIdsCopied", {
          count: transactionIds.length,
        })
      );
    } catch {
      toast.error(i18n.t("payments.transactionIdsCopyFailed"));
    }
  };

  const downloadSelectedPayments = async (selectedPayments: Payment[]) => {
    const ids = selectedPayments.map(p => p.id);

    try {
      const response = await paymentsApi.bulkDownload(ids);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payments_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(
        i18n.t("payments.bulkDownloadSuccess", { count: ids.length })
      );
    } catch {
      toast.error(i18n.t("payments.bulkDownloadFailed"));
    }
  };

  const baseCurrency = company?.baseCurrency || data?.baseCurrency || "USD";
  const payments = data?.payments || [];

  useEffect(() => {
    setVisiblePaymentCount(PAYMENTS_BATCH_SIZE);
  }, [payments.length]);

  const visiblePayments = useMemo(
    () => payments.slice(0, visiblePaymentCount),
    [payments, visiblePaymentCount]
  );
  const hasMorePayments = visiblePaymentCount < payments.length;
  const loadMorePayments = useCallback(() => {
    setVisiblePaymentCount(previousCount =>
      Math.min(previousCount + PAYMENTS_BATCH_SIZE, payments.length)
    );
  }, [payments.length]);

  const loadMorePaymentsRef = useInfiniteLoadTrigger({
    enabled: hasMorePayments,
    loading: false,
    onLoadMore: loadMorePayments,
  });

  const getTransactionTypeBadge = (type: string) => {
    const typeLabels = {
      manual: i18n.t("payments.manual"),
      stripe: i18n.t("payments.stripe"),
      paypal: i18n.t("payments.paypal"),
      bank_transfer: i18n.t("payments.bankTransfer"),
      check: i18n.t("payments.check"),
      ach: "ACH",
      visa: i18n.t("payments.visa"),
      mastercard: i18n.t("payments.mastercard"),
      amex: i18n.t("payments.amex"),
      debit_card: i18n.t("payments.debitCard"),
      cash: i18n.t("payments.cash"),
      credit_card: i18n.t("payments.creditCard"),
      upi: i18n.t("payments.upi"),
      razorpay: i18n.t("payments.razorpay"),
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

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      paid: i18n.t("payments.paid"),
      pending: i18n.t("payments.pending"),
      failed: i18n.t("payments.failed"),
      refunded: i18n.t("payments.refunded"),
      completed: i18n.t("payments.completed"),
      partially_paid: i18n.t("payments.partiallyPaid"),
      cancelled: i18n.t("payments.cancelled"),
    };

    return statusLabels[status] || status;
  };

  const getPayoutStatusLabel = (status?: string) => {
    if (!status) return i18n.t("payments.notWithdrawn");

    const payoutStatusLabels = {
      pending: i18n.t("payments.withdrawalPending"),
      processing: i18n.t("payments.withdrawalProcessing"),
      queued: i18n.t("payments.withdrawalQueued"),
      processed: i18n.t("payments.withdrawalProcessed"),
      failed: i18n.t("payments.withdrawalFailed"),
      reversed: i18n.t("payments.withdrawalReversed"),
      cancelled: i18n.t("payments.withdrawalCancelled"),
    };

    return payoutStatusLabels[status] || status;
  };

  const getPayoutBadgeClassName = (status?: string) => {
    switch (status) {
      case "processed":
        return "bg-primary/10 text-primary border-primary/20";
      case "failed":
      case "reversed":
      case "cancelled":
        return "bg-card text-destructive border-border";
      case "pending":
      case "processing":
      case "queued":
        return "bg-muted text-foreground border-border";
      default:
        return "bg-card text-muted-foreground border-border";
    }
  };

  const canWithdrawRazorpayPayment = (payment: Payment) =>
    payment.transactionType === "razorpay" &&
    (!payment.razorpayPayout ||
      ["failed", "reversed", "cancelled"].includes(
        payment.razorpayPayout.status
      ));

  const columns: ColumnDef<Payment>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label={i18n.t("selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label={i18n.t("selectRow")}
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
          {i18n.t("date")}
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
      header: i18n.t("payments.invoice"),
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
      header: i18n.t("client"),
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
          {i18n.t("amount")}
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
      header: i18n.t("payments.notes"),
      cell: ({ row }) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          {row.original.note || "—"}
        </span>
      ),
    },
    {
      accessorKey: "transactionType",
      header: i18n.t("payments.paymentMethod"),
      cell: ({ row }) => getTransactionTypeBadge(row.original.transactionType),
    },
    {
      id: "status",
      header: i18n.t("status"),
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
      id: "withdrawal",
      header: i18n.t("payments.withdrawal"),
      cell: ({ row }) => {
        const payout = row.original.razorpayPayout;

        if (row.original.transactionType !== "razorpay") {
          return <span className="text-sm text-muted-foreground">—</span>;
        }

        return (
          <Badge
            variant="outline"
            className={getPayoutBadgeClassName(payout?.status)}
          >
            {getPayoutStatusLabel(payout?.status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;
        const canWithdraw = canWithdrawRazorpayPayment(payment);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={i18n.t("payments.openMenu")}
                data-testid={`payment-actions-trigger-${payment.id}`}
              >
                <DotsThree className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{i18n.t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(payment.transactionId)
                }
              >
                {i18n.t("payments.copyTransactionId")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {payment.invoiceId && (
                <DropdownMenuItem
                  onClick={() => navigate(`/invoices/${payment.invoiceId}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {i18n.t("payments.viewInvoice")}
                </DropdownMenuItem>
              )}
              {payment.transactionType === "razorpay" && isAdminUser && (
                <DropdownMenuItem
                  disabled={!canWithdraw || withdrawingPaymentId === payment.id}
                  data-testid={`payment-action-withdraw-${payment.id}`}
                  onClick={() => withdrawRazorpayPayment(payment)}
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  {withdrawingPaymentId === payment.id
                    ? i18n.t("payments.withdrawing")
                    : payment.razorpayPayout
                    ? i18n.t("payments.retryWithdrawal")
                    : i18n.t("payments.withdrawToUpi")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                {i18n.t("payments.downloadReceipt")}
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
          <p className="text-muted-foreground">
            {i18n.t("payments.failedToLoadPayments")}
          </p>
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
            {i18n.t("payments.paymentLedgerDescription")}
          </p>
        </div>
        {isAdminUser && (
          <Button
            onClick={openManualEntry}
            className="bg-foreground text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            {i18n.t("payments.addManualEntry")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("payments.totalPayments")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("payments.transactions")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("payments.totalCollected")}
            </CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormat(baseCurrency, totalAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {i18n.t("payments.allTime")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {i18n.t("payments.averagePayment")}
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
              {i18n.t("payments.perTransaction")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>{i18n.t("payments.paymentHistory")}</CardTitle>
          <CardDescription>
            {i18n.t("payments.paymentHistoryDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-4">
              <DataTable
                columns={columns}
                data={visiblePayments}
                renderSelectedRowsActions={({ selectedRows }) => (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySelectedTransactionIds(selectedRows)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {i18n.t("payments.copyTransactionIds")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSelectedPayments(selectedRows)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {i18n.t("payments.downloadSelected")}
                    </Button>
                  </>
                )}
                searchPlaceholder={i18n.t(
                  "payments.searchByInvoiceClientMethodOrNotes"
                )}
                showPagination={false}
              />
              <div className="flex flex-col items-center gap-2 pb-2 text-sm text-muted-foreground">
                <span>
                  {i18n.t("payments.showingPaymentsCount", {
                    visible: visiblePayments.length,
                    total: payments.length,
                  })}
                </span>
                {hasMorePayments && (
                  <span>{i18n.t("payments.scrollToLoadMore")}</span>
                )}
                {hasMorePayments && (
                  <div ref={loadMorePaymentsRef} className="h-8 w-full" />
                )}
                {!hasMorePayments && (
                  <span>{i18n.t("payments.allPaymentsLoaded")}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mb-4 mt-4 text-muted-foreground">
                {i18n.t("payments.noPaymentsRecorded")}
              </p>
              {isAdminUser && (
                <Button variant="outline" onClick={openManualEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  {i18n.t("payments.addManualEntry")}
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
