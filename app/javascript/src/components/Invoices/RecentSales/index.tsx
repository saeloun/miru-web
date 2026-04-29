import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { currencyFormat } from "helpers/currency";
import { format, parseISO } from "date-fns";
import { TrendUp, TrendDown, ArrowUpRight, User } from "phosphor-react";
import { i18n } from "../../../i18n";

interface RecentSalesProps {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    client: {
      name: string;
      email: string;
      logo?: string;
    };
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  className?: string;
}

const RecentSales: React.FC<RecentSalesProps> = ({ invoices, className }) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <TrendUp className="h-3 w-3 text-foreground" />;
      case "overdue":
        return <TrendDown className="h-3 w-3 text-destructive" />;
      default:
        return <ArrowUpRight className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "overdue":
        return "border-destructive/40 bg-destructive/10 text-destructive";
      case "paid":
      case "sent":
      case "viewed":
      case "draft":
        return "border-border bg-card text-card-foreground";
      default:
        return "border-border bg-card text-card-foreground";
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const calculateGrowth = (currentAmount: number, previousAmount: number) => {
    if (previousAmount === 0) return 0;

    return ((currentAmount - previousAmount) / previousAmount) * 100;
  };

  // Sort by most recent first
  const sortedInvoices = [...invoices]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5); // Show only 5 most recent

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {i18n.t("invoiceDashboard.recentSales")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground"></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedInvoices.map((invoice, index) => {
            const previousInvoice = sortedInvoices[index + 1];
            const growth = previousInvoice
              ? calculateGrowth(invoice.amount, previousInvoice.amount)
              : 0;

            return (
              <div
                key={invoice.id}
                className="flex items-center space-x-4 p-4 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={invoice.client.logo}
                    alt={invoice.client.name}
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {getInitials(invoice.client.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {invoice.client.name}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(invoice.status)}
                      <Badge
                        variant="secondary"
                        className={`border text-xs ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {i18n.t("invoices.invoiceHash", {
                        number: invoice.invoiceNumber,
                      })}
                    </p>
                    <p className="text-sm font-medium">
                      {currencyFormat(invoice.currency, invoice.amount)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(invoice.updatedAt), "MMM dd, HH:mm")}
                    </p>
                    {growth !== 0 && (
                      <div
                        className={`flex items-center space-x-1 text-xs ${
                          growth > 0 ? "text-foreground" : "text-destructive"
                        }`}
                      >
                        {growth > 0 ? (
                          <TrendUp className="h-3 w-3" />
                        ) : (
                          <TrendDown className="h-3 w-3" />
                        )}
                        <span>{Math.abs(growth).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {sortedInvoices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                {i18n.t("noResultsFound")}
              </p>
              <p className="text-xs text-muted-foreground"></p>
            </div>
          )}
        </div>

        {sortedInvoices.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {i18n.t("invoices.showingRecentTransactions", {
                  count: sortedInvoices.length,
                })}
              </span>
              <button className="font-medium text-foreground hover:text-foreground/80">
                {i18n.t("all")} →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;
