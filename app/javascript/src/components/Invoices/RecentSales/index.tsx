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
import { TrendingUp, TrendingDown, ArrowUpRight, User } from "lucide-react";

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
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "overdue":
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <ArrowUpRight className="h-3 w-3 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "sent":
      case "viewed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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
        <CardTitle className="text-lg font-semibold">Recent Sales</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Latest invoice transactions and updates
        </CardDescription>
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
                  <AvatarFallback className="bg-[#5B34EA]/10 text-[#5B34EA] text-xs font-medium">
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
                        className={`text-xs ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Invoice #{invoice.invoiceNumber}
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
                          growth > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {growth > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
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
                No recent sales
              </p>
              <p className="text-xs text-muted-foreground">
                Sales will appear here once you create invoices
              </p>
            </div>
          )}
        </div>

        {sortedInvoices.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {sortedInvoices.length} recent transactions</span>
              <button className="text-[#5B34EA] hover:text-[#4926D1] font-medium">
                View all →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;
