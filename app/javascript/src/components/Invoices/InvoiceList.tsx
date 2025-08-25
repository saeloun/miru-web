import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  Clock,
  FileText,
  Hourglass,
  Funnel,
  X,
  CircleNotch,
} from "phosphor-react";

import { Invoice } from "../../services/invoiceApi";
import ChartWithSummary from "./ChartWithSummary";
import RecentlyUpdated from "./List/RecentlyUpdated";

interface InvoiceListProps {
  invoices: Invoice[];
  summary?: any;
  recentlyUpdatedInvoices?: Invoice[];
  onCreateInvoice?: () => void;
  onViewInvoice?: (id: string) => void;
  onSendInvoice?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
  onDownload?: (id: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  summary,
  recentlyUpdatedInvoices,
  onCreateInvoice,
  onViewInvoice,
  onSendInvoice,
  onMarkPaid,
  onDownload,
  onLoadMore,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
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

  // Use recentlyUpdatedInvoices from API or calculate fallback
  const recentInvoices =
    recentlyUpdatedInvoices ||
    invoices
      .sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      )
      .slice(0, 10);

  const formatCurrency = (amount: number, currency: string = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "sent":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "overdue":
        return <Warning className="h-4 w-4 text-red-600" />;
      case "draft":
        return <Circle className="h-4 w-4 text-gray-500" />;
      case "viewed":
        return <Eye className="h-4 w-4 text-indigo-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: {
        icon: CheckCircle,
        bgColor: "#dcfce7",
        textColor: "#166534",
        borderColor: "#86efac",
        label: "Paid",
      },
      sent: {
        icon: PaperPlaneTilt,
        bgColor: "#dbeafe",
        textColor: "#1e40af",
        borderColor: "#93c5fd",
        label: "Sent",
      },
      overdue: {
        icon: Warning,
        bgColor: "#fee2e2",
        textColor: "#991b1b",
        borderColor: "#fca5a5",
        label: "Overdue",
      },
      draft: {
        icon: FileText,
        bgColor: "#f3f4f6",
        textColor: "#374151",
        borderColor: "#d1d5db",
        label: "Draft",
      },
      viewed: {
        icon: Eye,
        bgColor: "#e0e7ff",
        textColor: "#3730a3",
        borderColor: "#a5b4fc",
        label: "Viewed",
      },
      pending: {
        icon: Hourglass,
        bgColor: "#fef3c7",
        textColor: "#92400e",
        borderColor: "#fde047",
        label: "Pending",
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Check filterParams.status first (from ChartWithSummary cards), then fallback to statusFilter
    let matchesStatus = true;
    if (filterParams.status && filterParams.status.length > 0) {
      matchesStatus = filterParams.status.some(
        (statusObj: any) => invoice.status === statusObj.value
      );
    } else {
      matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    }

    const matchesClient =
      clientFilter === "all" || invoice.client.name === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const uniqueClients = Array.from(
    new Set(invoices.map(inv => inv.client.name))
  );

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

  const getQuickActions = (invoice: Invoice) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <DotsThree className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewInvoice?.(invoice.id)}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload?.(invoice.id)}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {invoice.status === "draft" && (
          <DropdownMenuItem onClick={() => onSendInvoice?.(invoice.id)}>
            <PaperPlaneTilt className="h-4 w-4 mr-2" />
            PaperPlaneTilt
          </DropdownMenuItem>
        )}
        {invoice.status !== "paid" && (
          <DropdownMenuItem onClick={() => onMarkPaid?.(invoice.id)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Paid
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6 p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your invoices and track payments
          </p>
        </div>
        <Button onClick={onCreateInvoice}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
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

      {/* Recently Updated Invoices */}
      {recentInvoices.length > 0 && (
        <RecentlyUpdated recentlyUpdatedInvoices={recentInvoices} />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* MagnifyingGlass */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Invoices..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter - Show active filter from cards */}
            {filterParams.status && filterParams.status.length > 0 ? (
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
            ) : (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Client Filter */}
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm ||
                    statusFilter !== "all" ||
                    clientFilter !== "all"
                      ? "No invoices match your filters"
                      : "No invoices yet"}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredInvoices.map(invoice => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onViewInvoice?.(invoice.id)}
                    >
                      <TableCell>{getStatusIcon(invoice.status)}</TableCell>
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
                        {formatCurrency(
                          invoice.status === "overdue" && invoice.amountDue
                            ? invoice.amountDue
                            : invoice.amount,
                          invoice.currency
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
                          Loading more invoices...
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

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredInvoices.filter(inv => inv.status === "draft").length}
              </div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredInvoices.filter(inv => inv.status === "sent").length}
              </div>
              <div className="text-sm text-muted-foreground">Sent</div>
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
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {formatCurrency(
                  filteredInvoices
                    .filter(inv => inv.status === "paid")
                    .reduce((sum, inv) => sum + inv.amount, 0)
                )}
              </div>
              <div className="text-sm text-muted-foreground">Collected</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
