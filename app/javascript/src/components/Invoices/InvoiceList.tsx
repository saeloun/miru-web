import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import SendInvoice from "./common/InvoiceForm/SendInvoice";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  MagnifyingGlass,
  Plus,
  DotsThree,
  PaperPlaneTilt,
  Download,
  Eye,
  CheckCircle,
  Circle,
  Warning,
  FileText,
  Hourglass,
  Funnel,
  X,
  CircleNotch,
} from "phosphor-react";

import { ApiStatus as InvoiceStatus } from "../../constants";
import { Invoice } from "../../services/invoiceApi";
import ChartWithSummary from "./ChartWithSummary";
import { currencyFormat } from "../../helpers/currency";
import { useUserContext } from "../../context/UserContext";
import { i18n } from "../../i18n";

interface InvoiceListProps {
  invoices: Invoice[];
  totalInvoices?: number;
  summary?: any;
  onCreateInvoice?: () => void;
  onViewInvoice?: (id: string) => void;
  onSendInvoice?: (
    id: string,
    invoiceEmail?: { subject: string; message: string; recipients: string[] }
  ) => Promise<void> | void;
  onSendReminder?: (
    id: string,
    invoiceEmail?: { subject: string; message: string; recipients: string[] }
  ) => Promise<void> | void;
  onMarkPaid?: (invoice: Invoice) => void;
  onDownload?: (id: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  totalInvoices = invoices.length,
  summary,
  onCreateInvoice,
  onViewInvoice,
  onSendInvoice,
  onSendReminder,
  onMarkPaid,
  onDownload,
  onLoadMore,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const { companyRole } = useUserContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSendReminder, setIsSendReminder] = useState(false);
  const [sendStatus, setSendStatus] = useState<InvoiceStatus>(
    InvoiceStatus.IDLE
  );

  const [filterParams, setFilterParams] = useState({
    dateRange: { label: "All", value: "all", from: "", to: "" },
    clients: [],
    status: [],
  });
  const observerTarget = useRef<HTMLDivElement>(null);

  // Use summary from API or calculate fallback
  const calculatedSummary = summary || {
    overdueAmount: invoices
      .filter(inv => inv.status === "overdue")
      .reduce((sum, inv) => sum + (inv.amount || 0), 0),
    outstandingAmount: invoices
      .filter(inv => ["sent", "viewed", "overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0),
    draftAmount: invoices
      .filter(inv => inv.status === "draft")
      .reduce((sum, inv) => sum + (inv.amount || 0), 0),
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: {
        icon: CheckCircle,
        bgColor: "#dcfce7",
        textColor: "#166534",
        borderColor: "#86efac",
        label: i18n.t("invoices.paid"),
      },
      sent: {
        icon: PaperPlaneTilt,
        bgColor: "#dbeafe",
        textColor: "#1e40af",
        borderColor: "#93c5fd",
        label: i18n.t("invoices.sent"),
      },
      overdue: {
        icon: Warning,
        bgColor: "#fee2e2",
        textColor: "#991b1b",
        borderColor: "#fca5a5",
        label: i18n.t("invoices.overdue"),
      },
      draft: {
        icon: FileText,
        bgColor: "#f3f4f6",
        textColor: "#374151",
        borderColor: "#d1d5db",
        label: i18n.t("invoices.draft"),
      },
      viewed: {
        icon: Eye,
        bgColor: "#e0e7ff",
        textColor: "#3730a3",
        borderColor: "#a5b4fc",
        label: i18n.t("invoices.sent"),
      },
      pending: {
        icon: Hourglass,
        bgColor: "#fef3c7",
        textColor: "#92400e",
        borderColor: "#fde047",
        label: i18n.t("invoices.outstanding"),
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      icon: Circle,
      bgColor: "#f3f4f6",
      textColor: "#374151",
      borderColor: "#d1d5db",
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };

    const Icon = config.icon;

    return (
      <span
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          border: `1px solid ${config.borderColor}`,
          padding: "4px 10px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Icon size={14} />
        <span>{config.label}</span>
      </span>
    );
  };

  const matchesInvoiceFilters = (invoice: Invoice) => {
    const invoiceNumber = invoice.invoiceNumber?.toLowerCase() || "";
    const clientName = invoice.client?.name?.toLowerCase() || "";
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      invoiceNumber.includes(normalizedSearch) ||
      clientName.includes(normalizedSearch);

    let matchesStatus = true;
    if (filterParams.status && filterParams.status.length > 0) {
      matchesStatus = filterParams.status.some(
        (statusObj: any) => invoice.status === statusObj.value
      );
    }

    return matchesSearch && matchesStatus;
  };

  const filteredInvoices = invoices.filter(invoice =>
    matchesInvoiceFilters(invoice)
  );

  const hasActiveFilters =
    searchTerm.trim().length > 0 || filterParams.status.length > 0;

  // Infinite scroll implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          onLoadMore
        ) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const current = observerTarget.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  const canManageInvoices = companyRole === "owner" || companyRole === "admin";

  const openSendDialog = (invoice: Invoice, reminder = false) => {
    setActiveInvoice(invoice);
    setIsSendReminder(reminder);
    setIsSending(true);
    setSendStatus(InvoiceStatus.IDLE);
  };

  const handleSendSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>,
    invoiceEmail: { subject: string; message: string; recipients: string[] }
  ) => {
    event.preventDefault();
    if (!activeInvoice) return;

    try {
      setSendStatus(InvoiceStatus.LOADING);
      if (isSendReminder) {
        await onSendReminder?.(activeInvoice.id, invoiceEmail);
      } else {
        await onSendInvoice?.(activeInvoice.id, invoiceEmail);
      }
      setSendStatus(InvoiceStatus.SUCCESS);
      setIsSending(false);
      setIsSendReminder(false);
      setActiveInvoice(null);
    } catch {
      setSendStatus(InvoiceStatus.ERROR);
    }
  };

  const getQuickActions = (invoice: Invoice) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid={`invoice-actions-trigger-${invoice.id}`}
        >
          <DotsThree className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          data-testid={`invoice-action-view-${invoice.id}`}
          onClick={() => onViewInvoice?.(invoice.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {i18n.t("invoices.invoice")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid={`invoice-action-download-${invoice.id}`}
          onClick={() => onDownload?.(invoice.id)}
        >
          <Download className="h-4 w-4 mr-2" />
          {i18n.t("download")}
        </DropdownMenuItem>
        {canManageInvoices && (
          <>
            <DropdownMenuSeparator />
            {invoice.status === "draft" && (
              <DropdownMenuItem
                data-testid={`invoice-action-send-${invoice.id}`}
                onClick={() => openSendDialog(invoice)}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                {i18n.t("invoices.sendInvoice")}
              </DropdownMenuItem>
            )}
            {invoice.status === "overdue" && (
              <DropdownMenuItem
                data-testid={`invoice-action-reminder-${invoice.id}`}
                onClick={() => openSendDialog(invoice, true)}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                {i18n.t("invoices.sendReminder")}
              </DropdownMenuItem>
            )}
            {invoice.status !== "paid" && (
              <DropdownMenuItem
                data-testid={`invoice-action-mark-paid-${invoice.id}`}
                onClick={() => onMarkPaid?.(invoice)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {i18n.t("invoices.markAsPaid")}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6 p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground md:text-base">
            {i18n.t("invoices.invoices")}
          </p>
        </div>
        {canManageInvoices && (
          <Button onClick={onCreateInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            {i18n.t("invoices.createNewInvoice")}
          </Button>
        )}
      </div>

      {/* Charts and Summary */}
      {invoices.length > 0 && calculatedSummary && (
        <ChartWithSummary
          summary={calculatedSummary}
          baseCurrency={summary?.currency || invoices[0]?.currency || "USD"}
          filterParams={filterParams}
          setFilterParams={setFilterParams}
        />
      )}

      {/* Search Only */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={i18n.t("searchInvoices")}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Show active filter from cards */}
            {filterParams.status && filterParams.status.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Funnel className="h-3 w-3" />
                  {filterParams.status[0].label}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilterParams({ ...filterParams, status: [] })
                  }
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{i18n.t("invoices.invoice")}</TableHead>
                <TableHead>{i18n.t("client")}</TableHead>
                <TableHead>{i18n.t("status")}</TableHead>
                <TableHead>{i18n.t("invoices.issueDate")}</TableHead>
                <TableHead>{i18n.t("invoices.dueDate")}</TableHead>
                <TableHead className="text-right">{i18n.t("amount")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {i18n.t("loading")}
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm
                      ? i18n.t("noResultsFound")
                      : i18n.t("invoices.noInvoiceGenerated")}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredInvoices.map(invoice => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50"
                      data-testid={`invoice-row-${invoice.id}`}
                      onClick={() => onViewInvoice?.(invoice.id)}
                    >
                      <TableCell>
                        <div className="font-medium">
                          #{invoice.invoiceNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invoice.client.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.issueDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencyFormat(
                          invoice.currency,
                          invoice.status === "overdue" && invoice.amountDue
                            ? invoice.amountDue
                            : invoice.amount
                        )}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        {getQuickActions(invoice)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {isLoadingMore && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        <CircleNotch className="h-6 w-6 mx-auto animate-spin text-blue-600" />
                        <span className="text-sm text-muted-foreground mt-2 block">
                          {i18n.t("invoices.loadingMoreInvoices")}
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-4" />

      {filteredInvoices.length > 0 && (
        <div className="flex flex-col items-center gap-2 pb-2 text-sm text-muted-foreground">
          <span>
            {hasActiveFilters
              ? i18n.t("invoices.viewingMatching", {
                  filtered: filteredInvoices.length,
                  loaded: invoices.length,
                })
              : i18n.t("invoices.loadedOf", {
                  loaded: invoices.length,
                  total: totalInvoices,
                })}
          </span>
          {!hasActiveFilters && hasMore && !isLoadingMore && (
            <span>{i18n.t("invoices.scrollToLoadMore")}</span>
          )}
          {!hasActiveFilters && hasMore && !isLoadingMore && (
            <div className="h-8 w-full" />
          )}
          {!hasActiveFilters && !hasMore && (
            <span>{i18n.t("invoices.allInvoicesLoaded")}</span>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredInvoices.filter(inv => inv.status === "draft").length}
              </div>
              <div className="text-sm text-muted-foreground">
                {i18n.t("invoices.draft")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredInvoices.filter(inv => inv.status === "sent").length}
              </div>
              <div className="text-sm text-muted-foreground">
                {i18n.t("invoices.sent")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {
                  filteredInvoices.filter(inv => inv.status === "overdue")
                    .length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {i18n.t("invoices.overdue")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {currencyFormat(
                  "USD",
                  filteredInvoices
                    .filter(inv => inv.status === "paid")
                    .reduce((sum, inv) => sum + inv.amount, 0)
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {i18n.t("invoices.collected")}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {activeInvoice && isSending && (
        <SendInvoice
          handleSubmit={handleSendSubmit}
          invoice={activeInvoice}
          isSendReminder={isSendReminder}
          isSending={isSending}
          setIsSendReminder={setIsSendReminder}
          setIsSending={setIsSending}
          status={sendStatus}
        />
      )}
    </div>
  );
};

export default InvoiceList;
