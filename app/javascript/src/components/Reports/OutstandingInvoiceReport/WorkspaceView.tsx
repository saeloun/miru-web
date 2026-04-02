import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
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
import { Receipt, Warning, Clock, CurrencyDollar } from "phosphor-react";
import { currencyFormat } from "../../../helpers/currency";
import { useUserContext } from "../../../context/UserContext";
import { i18n } from "../../../i18n";
import { invoicesApi } from "apis/api";

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
  issue_date: string;
  due_date: string;
  status: "sent" | "viewed" | "overdue";
  currency: string;
  base_currency_amount?: number;
}

interface ClientGroup {
  client_id: string;
  client_name: string;
  invoices: Invoice[];
  total_outstanding: number;
  total_overdue: number;
}

interface FetchFilters {
  fromDate?: string;
  toDate?: string;
  selectedCurrency?: string;
}

const outstandingStatuses = ["sent", "viewed", "overdue"];

const parseDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);

  return Number.isNaN(d.getTime()) ? null : d;
};

const amountDue = (invoice: Invoice) =>
  parseFloat(String(invoice.amount_due || invoice.amount || 0));

const amountDueInBaseCurrency = (invoice: Invoice) => {
  const fullAmount = parseFloat(String(invoice.amount || 0));
  const due = amountDue(invoice);
  const baseCurrencyAmount = parseFloat(
    String(invoice.base_currency_amount || 0)
  );

  if (baseCurrencyAmount > 0 && fullAmount > 0) {
    const ratio = due / fullAmount;

    return ratio * baseCurrencyAmount;
  }

  return due;
};

const isWithinDateRange = (
  invoice: Invoice,
  fromDate?: string,
  toDate?: string
) => {
  const date = parseDate(invoice.issue_date);
  if (!date) return false;

  const from = parseDate(fromDate);
  const to = parseDate(toDate);

  if (from && date < from) return false;

  if (to && date > to) return false;

  return true;
};

const daysOverdue = (invoice: Invoice) => {
  const due = parseDate(invoice.due_date);
  if (!due) return 0;
  const now = new Date();
  const diff = now.getTime() - due.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const fetchOutstandingInvoices = async (filters: FetchFilters = {}) => {
  const queryParams = new URLSearchParams();

  outstandingStatuses.forEach(status => {
    queryParams.append("status[]", status);
  });

  queryParams.append("per", "1000");

  const response = await invoicesApi.get(queryParams.toString());
  const invoices: Invoice[] = response.data.invoices || [];

  const filteredInvoices = invoices.filter(invoice => {
    if (filters.selectedCurrency && filters.selectedCurrency !== "ALL") {
      if ((invoice.currency || "").toUpperCase() !== filters.selectedCurrency) {
        return false;
      }
    }

    if (filters.fromDate || filters.toDate) {
      return isWithinDateRange(invoice, filters.fromDate, filters.toDate);
    }

    return true;
  });

  const clientsMap = new Map<string, ClientGroup>();

  filteredInvoices.forEach(invoice => {
    const clientId = invoice.client_id;
    const clientName =
      invoice.client_name ||
      invoice.client?.name ||
      i18n.t("reports.unknownClient");

    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        client_id: clientId,
        client_name: clientName,
        invoices: [],
        total_outstanding: 0,
        total_overdue: 0,
      });
    }

    const client = clientsMap.get(clientId)!;
    client.invoices.push(invoice);

    const convertedDue = amountDueInBaseCurrency(invoice);

    if (invoice.status === "overdue") {
      client.total_overdue += convertedDue;
    } else if (["sent", "viewed"].includes(invoice.status)) {
      client.total_outstanding += convertedDue;
    }
  });

  const clientsList = Array.from(clientsMap.values()).sort((a, b) =>
    a.client_name.localeCompare(b.client_name)
  );

  const summary = {
    total_invoices: filteredInvoices.length,
    total_amount: filteredInvoices.reduce(
      (sum, inv) => sum + amountDueInBaseCurrency(inv),
      0
    ),
    total_outstanding: filteredInvoices
      .filter(inv => ["sent", "viewed"].includes(inv.status))
      .reduce((sum, inv) => sum + amountDueInBaseCurrency(inv), 0),
    total_overdue: filteredInvoices
      .filter(inv => inv.status === "overdue")
      .reduce((sum, inv) => sum + amountDueInBaseCurrency(inv), 0),
  };

  const currencies = Array.from(
    new Set(
      filteredInvoices.map(invoice => (invoice.currency || "USD").toUpperCase())
    )
  ).sort();

  return {
    clients: clientsList,
    invoices: filteredInvoices,
    summary,
    currencies,
    currency: response.data.summary?.currency || "USD",
  };
};

const OutstandingInvoicesWorkspaceView: React.FC = () => {
  const { company } = useUserContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "overdue" ? "overdue" : "outstanding";
  const initialFromDate = searchParams.get("from") || "";
  const initialToDate = searchParams.get("to") || "";
  const initialCurrencyFilter = (
    searchParams.get("currency") || "ALL"
  ).toUpperCase();

  const [activeTab, setActiveTab] = useState<"outstanding" | "overdue">(
    initialTab
  );
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [pendingFromDate, setPendingFromDate] = useState(initialFromDate);
  const [pendingToDate, setPendingToDate] = useState(initialToDate);
  const [currencyFilter, setCurrencyFilter] = useState(initialCurrencyFilter);
  const [pendingCurrencyFilter, setPendingCurrencyFilter] = useState(
    initialCurrencyFilter
  );
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportNotice, setExportNotice] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["outstanding-invoices", fromDate, toDate, currencyFilter],
    queryFn: () =>
      fetchOutstandingInvoices({
        fromDate,
        toDate,
        selectedCurrency: currencyFilter,
      }),
  });

  const baseCurrency = data?.currency || company?.baseCurrency || "USD";

  const overdueInvoices = useMemo(
    () =>
      (data?.invoices || []).filter(invoice => invoice.status === "overdue"),
    [data?.invoices]
  );

  const overdueAging = useMemo(() => {
    const buckets = {
      "0-30 Days": 0,
      "31-60 Days": 0,
      "60+ Days": 0,
    };

    overdueInvoices.forEach(invoice => {
      const dueDays = daysOverdue(invoice);
      const converted = amountDueInBaseCurrency(invoice);

      if (dueDays <= 30) {
        buckets["0-30 Days"] += converted;
      } else if (dueDays <= 60) {
        buckets["31-60 Days"] += converted;
      } else {
        buckets["60+ Days"] += converted;
      }
    });

    return buckets;
  }, [overdueInvoices]);

  const currencyBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    (data?.invoices || []).forEach(invoice => {
      const key = (invoice.currency || "USD").toUpperCase();
      map.set(key, (map.get(key) || 0) + amountDue(invoice));
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data?.invoices]);

  const sortedClients = useMemo(
    () =>
      [...(data?.clients || [])].sort((a, b) => {
        const totalA = a.total_outstanding + a.total_overdue;
        const totalB = b.total_outstanding + b.total_overdue;

        return totalB - totalA;
      }),
    [data?.clients]
  );

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;

    return (
      (data?.clients || []).find(
        client => client.client_id === selectedClientId
      ) || null
    );
  }, [data?.clients, selectedClientId]);

  const applyCurrencyFilter = () => {
    setCurrencyFilter(pendingCurrencyFilter);
  };

  const applyDateFilter = () => {
    setFromDate(pendingFromDate);
    setToDate(pendingToDate);
  };

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (activeTab !== "outstanding") {
      nextParams.set("tab", activeTab);
    }

    if (currencyFilter !== "ALL") {
      nextParams.set("currency", currencyFilter);
    }

    if (fromDate) {
      nextParams.set("from", fromDate);
    }

    if (toDate) {
      nextParams.set("to", toDate);
    }

    setSearchParams(nextParams, { replace: true });
  }, [activeTab, currencyFilter, fromDate, setSearchParams, toDate]);

  const refreshData = async () => {
    await refetch();
    setExportNotice(i18n.t("reports.dataRefreshed"));
  };

  const exportReport = (format: string) => {
    const normalized = format.toLowerCase();
    const apiFormat = normalized === "excel" ? "csv" : normalized;
    const params = new URLSearchParams({ format: apiFormat });
    window.open(
      `/api/v1/reports/outstanding_overdue_invoices/download?${params.toString()}`,
      "_blank"
    );

    setExportNotice(
      i18n.t("reports.generatingExport", { format: format.toUpperCase() })
    );
  };

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Warning size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {i18n.t("reports.failedToLoadReportData")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {i18n.t("reports.outstandingAndOverdue")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {i18n.t("reports.followUpOnInvoices")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeTab === "outstanding" ? "default" : "outline"}
            onClick={() => setActiveTab("outstanding")}
          >
            {i18n.t("reports.outstanding")}
          </Button>
          <Button
            variant={activeTab === "overdue" ? "default" : "outline"}
            onClick={() => setActiveTab("overdue")}
          >
            {i18n.t("reports.overdue")}
          </Button>
          <Button variant="outline" onClick={refreshData}>
            {i18n.t("reports.refresh")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t("filters")}</CardTitle>
          <CardDescription>{baseCurrency}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency-filter">
                {i18n.t("reports.currencyFilter")}
              </Label>
              <select
                id="currency-filter"
                aria-label={i18n.t("reports.currencyFilter")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={pendingCurrencyFilter}
                onChange={e => setPendingCurrencyFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                {(data?.currencies || []).map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-date">{i18n.t("reports.fromDate")}</Label>
              <Input
                id="from-date"
                aria-label={i18n.t("reports.fromDate")}
                type="date"
                value={pendingFromDate}
                onChange={e => setPendingFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">{i18n.t("reports.toDate")}</Label>
              <Input
                id="to-date"
                aria-label={i18n.t("reports.toDate")}
                type="date"
                value={pendingToDate}
                onChange={e => setPendingToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={applyCurrencyFilter}>
              {i18n.t("reports.applyFilter")}
            </Button>
            <Button onClick={applyDateFilter} variant="outline">
              {i18n.t("reports.applyDateFilter")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="report-summary">
        <CardHeader>
          <CardTitle>{i18n.t("summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="outstanding-summary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {i18n.t("reports.totalOutstanding")}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">
                    {currencyFormat(
                      baseCurrency,
                      data?.summary.total_outstanding || 0
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="overdue-summary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {i18n.t("reports.totalOverdue")}
                </CardTitle>
                <Warning className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-destructive">
                    {currencyFormat(
                      baseCurrency,
                      data?.summary.total_overdue || 0
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {i18n.t("reports.totalInvoices")}
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {data?.summary.total_invoices || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="filtered-summary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {i18n.t("reports.totalAmount")}
                </CardTitle>
                <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {currencyFormat(
                      baseCurrency,
                      data?.summary.total_amount || 0
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t("reports.exportSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-48 space-y-2">
              <Label htmlFor="export-format">
                {i18n.t("reports.formatLabel")}
              </Label>
              <select
                id="export-format"
                aria-label={i18n.t("reports.formatLabel")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value)}
              >
                <option value="CSV">CSV</option>
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
              </select>
            </div>
            <Button onClick={() => exportReport(exportFormat)}>
              {i18n.t("download")}
            </Button>
            <Button variant="outline" onClick={() => exportReport("PDF")}>
              {i18n.t("reports.exportPdfBtn")}
            </Button>
            <Button variant="outline" onClick={() => exportReport("CSV")}>
              {i18n.t("reports.exportCsvBtn")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportNotice(i18n.t("reports.exportStarted"))}
            >
              {i18n.t("reports.export")}
            </Button>
          </div>
          {exportNotice ? <p>{exportNotice}</p> : null}
        </CardContent>
      </Card>

      <Card data-testid="status-chart">
        <CardHeader>
          <CardTitle>{i18n.t("reports.statusOverview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-chart="outstanding-overdue" className="text-sm">
            {i18n.t("reports.outstanding")}:{" "}
            {currencyFormat(baseCurrency, data?.summary.total_outstanding || 0)}
          </div>
          <div className="text-sm">
            {i18n.t("reports.overdue")}:{" "}
            {currencyFormat(baseCurrency, data?.summary.total_overdue || 0)}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="currency-chart">
        <CardHeader>
          <CardTitle>{i18n.t("reports.currencyDistribution")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currencyBreakdown.map(([currency, total]) => (
            <div key={currency} className="flex justify-between text-sm">
              <span>{currency}</span>
              <span>{currencyFormat(currency, total)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card data-testid="client-chart">
        <CardHeader>
          <CardTitle>{i18n.t("reports.topClients")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedClients.map(client => (
            <div
              key={client.client_id}
              className="flex items-center justify-between"
            >
              <a
                href="#"
                className="text-primary underline-offset-4 hover:underline"
                onClick={event => {
                  event.preventDefault();
                  setSelectedClientId(client.client_id);
                }}
              >
                {client.client_name}
              </a>
              <span>
                {currencyFormat(
                  baseCurrency,
                  client.total_outstanding + client.total_overdue
                )}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedClient ? (
        <>
          <Card data-testid="client-detail">
            <CardHeader>
              <CardTitle>{selectedClient.client_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {i18n.t("reports.outstanding")}:{" "}
                {currencyFormat(baseCurrency, selectedClient.total_outstanding)}
              </p>
              <p>
                {i18n.t("reports.overdue")}:{" "}
                {currencyFormat(baseCurrency, selectedClient.total_overdue)}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="client-analysis">
            <CardHeader>
              <CardTitle>{i18n.t("reports.clientAnalysis")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{i18n.t("reports.paymentBehavior")}</p>
              <p>
                {i18n.t("reports.averageDays")}{" "}
                {Math.round(
                  selectedClient.invoices
                    .filter(invoice => invoice.status === "overdue")
                    .reduce((acc, invoice) => acc + daysOverdue(invoice), 0) /
                    Math.max(
                      1,
                      selectedClient.invoices.filter(
                        invoice => invoice.status === "overdue"
                      ).length
                    )
                )}
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}

      {activeTab === "overdue" ? (
        <Card data-testid="overdue-aging">
          <CardHeader>
            <CardTitle>
              {i18n.t("reports.overdueAgingTitle", { currency: baseCurrency })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(overdueAging).map(([label, total]) => (
              <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span>{currencyFormat(baseCurrency, total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "overdue" ? (
        <Card data-testid="overdue-details">
          <CardHeader>
            <CardTitle>{i18n.t("reports.overdueDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueInvoices.map(invoice => (
              <div
                key={invoice.id}
                className="flex items-center justify-between"
              >
                <span>{invoice.client_name || invoice.client?.name}</span>
                <Badge variant="outline">{daysOverdue(invoice)} days</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card data-testid="client-breakdown">
        <CardHeader>
          <CardTitle>{i18n.t("reports.clientBreakdown")}</CardTitle>
          <CardDescription>
            {currencyFilter === "ALL"
              ? i18n.t("reports.allCurrencies")
              : i18n.t("reports.filteredByCurrency", {
                  currency: currencyFilter,
                })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border" data-testid="filtered-results">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{i18n.t("reports.clientHeader")}</TableHead>
                    <TableHead>{i18n.t("reports.invoiceHeader")}</TableHead>
                    <TableHead>{i18n.t("status")}</TableHead>
                    <TableHead>{i18n.t("reports.originalAmount")}</TableHead>
                    <TableHead>{i18n.t("reports.baseAmount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.invoices || []).length ? (
                    (data?.invoices || []).map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <a
                            href="#"
                            className="text-primary underline-offset-4 hover:underline"
                            onClick={event => {
                              event.preventDefault();
                              setSelectedClientId(invoice.client_id);
                            }}
                          >
                            {invoice.client_name || invoice.client?.name}
                          </a>
                        </TableCell>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell className="capitalize">
                          {invoice.status}
                        </TableCell>
                        <TableCell>
                          {currencyFormat(
                            invoice.currency || baseCurrency,
                            amountDue(invoice)
                          )}
                        </TableCell>
                        <TableCell>
                          {currencyFormat(
                            baseCurrency,
                            amountDueInBaseCurrency(invoice)
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {i18n.t("reports.noOutstandingOrOverdueInvoices")}
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

export default OutstandingInvoicesWorkspaceView;
