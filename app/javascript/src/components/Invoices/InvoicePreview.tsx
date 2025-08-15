import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Download, Send, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

import { Invoice } from "../../services/invoiceApi";

interface InvoicePreviewProps {
  invoice: Invoice;
  isPrintMode?: boolean;
  className?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  isPrintMode = false,
  className,
}) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(amount);

  const calculateSubtotal = () =>
    (invoice.invoiceLineItems || []).reduce(
      (sum, item) => sum + item.amount,
      0
    );

  const calculateTaxAmount = () =>
    calculateSubtotal() * ((invoice.tax || 0) / 100);

  const calculateDiscountAmount = () =>
    calculateSubtotal() * ((invoice.discount || 0) / 100);

  const calculateTotal = () =>
    calculateSubtotal() + calculateTaxAmount() - calculateDiscountAmount();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatAddress = (addressData: any): string => {
    if (typeof addressData === "string") {
      return addressData;
    }

    if (typeof addressData === "object" && addressData) {
      // Handle address object with individual fields
      const parts = [];
      if (addressData.address_line_1) parts.push(addressData.address_line_1);

      if (addressData.address_line_2) parts.push(addressData.address_line_2);

      if (addressData.city) parts.push(addressData.city);

      if (addressData.state) parts.push(addressData.state);

      if (addressData.pin) parts.push(addressData.pin);

      if (addressData.country) parts.push(addressData.country);

      return parts.join("\n");
    }

    return "";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <div className={cn("mx-auto max-w-4xl", className)}>
      {/* Action Bar - Hidden in print mode */}
      {!isPrintMode && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Invoice #{invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8 print:p-0">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            {/* Company Info */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {invoice.company?.name || "Miru Time Tracking"}
              </h1>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="whitespace-pre-line">
                  {invoice.company?.address ||
                    "456 Business Ave\nSuite 100\nSan Francisco, CA 94105\nUnited States"}
                </div>
                <div>{invoice.company?.email || "hello@miru.so"}</div>
                <div>{invoice.company?.phone || "+1 (555) 123-4567"}</div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-right">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                INVOICE
              </h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span>{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              BILL TO
            </h3>
            <div className="text-sm">
              <div className="font-medium text-foreground mb-1">
                {invoice.client.name}
              </div>
              <div className="text-muted-foreground space-y-1">
                <div className="whitespace-pre-line">
                  {formatAddress(invoice.client.address)}
                </div>
                <div>{invoice.client.email}</div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <div className="overflow-hidden border border-border rounded-lg">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {(invoice.invoiceLineItems || []).map((item, index) => (
                  <div
                    key={item.id || index}
                    className="grid grid-cols-12 gap-4 px-4 py-4 text-sm"
                  >
                    <div className="col-span-6">
                      <div className="font-medium text-foreground">
                        {item.description}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-muted-foreground">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      {formatCurrency(item.rate)}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-8 flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              {(invoice.tax || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({invoice.tax}%):
                  </span>
                  <span>{formatCurrency(calculateTaxAmount())}</span>
                </div>
              )}
              {(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount ({invoice.discount}%):
                  </span>
                  <span>-{formatCurrency(calculateDiscountAmount())}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              {invoice.status !== "paid" && invoice.status !== "draft" && (
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>Amount Due:</span>
                  <span>
                    {formatCurrency(invoice.amountDue || calculateTotal())}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reference */}
          {invoice.reference && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                REFERENCE
              </h3>
              <div className="text-sm text-muted-foreground">
                {invoice.reference}
              </div>
            </div>
          )}

          {/* Default Payment Instructions */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              PAYMENT INSTRUCTIONS
            </h3>
            <div className="text-sm text-muted-foreground">
              Payment is due within 30 days of invoice date. Please contact us
              if you have any questions about this invoice.
              <br />
              <br />
              Thank you for your business!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicePreview;
