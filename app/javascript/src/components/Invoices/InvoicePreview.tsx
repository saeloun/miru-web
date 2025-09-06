import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Download, PaperPlaneTilt, Eye, DotsThree } from "phosphor-react";
import { cn } from "../../lib/utils";
import { currencyFormat } from "../../helpers/currency";

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
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-500 text-white border-green-600 hover:bg-green-600";
      case "sent":
        return "bg-blue-500 text-white border-blue-600 hover:bg-blue-600";
      case "overdue":
        return "bg-red-500 text-white border-red-600 hover:bg-red-600";
      case "draft":
        return "bg-gray-400 text-white border-gray-500 hover:bg-gray-500";
      case "viewed":
        return "bg-purple-500 text-white border-purple-600 hover:bg-purple-600";
      case "pending":
        return "bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600";
      default:
        return "bg-gray-400 text-white border-gray-500 hover:bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return "Draft";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className={cn("mx-auto max-w-4xl", className)}>
      {/* Action Bar - Hidden in print mode */}
      {!isPrintMode && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "inline-flex items-center rounded-md px-3 py-1.5 font-geist-semibold text-xs uppercase tracking-wider transition-colors",
                getStatusColor(invoice.status || "draft")
              )}
            >
              {getStatusLabel(invoice.status)}
            </div>
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
              <PaperPlaneTilt className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" size="sm">
              <DotsThree className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-0 font-geist">
        <CardContent className="p-8 print:p-0 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            {/* Company Info with Logo */}
            <div className="space-y-4">
              {/* Logo placeholder - replace with actual logo */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-miru-han-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-geist-bold text-xl">M</span>
                </div>
                <h1 className="text-2xl font-geist-bold text-foreground tracking-tight">
                  {invoice.company?.name || "Miru Time Tracking"}
                </h1>
              </div>
              <div className="text-sm text-muted-foreground space-y-0.5 font-geist-regular">
                <div className="whitespace-pre-line">
                  {invoice.company?.address ||
                    "456 Business Ave\nSuite 100\nSan Francisco, CA 94105\nUnited States"}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span>{invoice.company?.email || "hello@miru.so"}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{invoice.company?.phone || "+1 (555) 123-4567"}</span>
                </div>
                {invoice.company?.taxId && (
                  <div className="mt-1">
                    <span className="font-geist-medium">Tax ID:</span> {invoice.company.taxId}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-right space-y-4">
              <h2 className="text-3xl font-geist-bold text-foreground tracking-tight">
                INVOICE
              </h2>
              <div className="text-sm space-y-2 font-geist-regular">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground font-geist-medium">Invoice #:</span>
                  <span className="font-geist-semibold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground font-geist-medium">Issue Date:</span>
                  <span className="font-geist-medium">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground font-geist-medium">Due Date:</span>
                  <span className="font-geist-medium">{formatDate(invoice.dueDate)}</span>
                </div>
                {invoice.reference && (
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground font-geist-medium">PO Number:</span>
                    <span className="font-geist-medium">{invoice.reference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Bill To Section */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-geist-semibold text-muted-foreground uppercase tracking-wider mb-3">
                BILL TO
              </h3>
              <div className="text-sm space-y-2">
                <div className="font-geist-semibold text-foreground text-base">
                  {invoice.client.name}
                </div>
                <div className="text-muted-foreground space-y-0.5 font-geist-regular">
                  <div className="whitespace-pre-line">
                    {formatAddress(invoice.client.address)}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span>{invoice.client.email}</span>
                    {invoice.client.phone && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{invoice.client.phone}</span>
                      </>
                    )}
                  </div>
                  {invoice.client.taxId && (
                    <div className="mt-1">
                      <span className="font-geist-medium">Tax ID:</span> {invoice.client.taxId}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Payment Details */}
            <div>
              <h3 className="text-xs font-geist-semibold text-muted-foreground uppercase tracking-wider mb-3">
                PAYMENT DETAILS
              </h3>
              <div className="text-sm space-y-2 font-geist-regular">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Terms:</span>
                  <span className="font-geist-medium">Net 30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-geist-medium">{invoice.currency || "USD"}</span>
                </div>
                {invoice.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-geist-medium">{invoice.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-xs font-geist-semibold text-muted-foreground uppercase tracking-wider mb-3">
              INVOICE DETAILS
            </h3>
            <div className="overflow-hidden border border-border rounded-lg">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 bg-muted/30 px-4 py-3 text-xs font-geist-semibold text-muted-foreground uppercase tracking-wide">
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
                    className="grid grid-cols-12 gap-4 px-4 py-4 text-sm hover:bg-muted/10 transition-colors"
                  >
                    <div className="col-span-6">
                      <div className="font-geist-medium text-foreground">
                        {item.description}
                      </div>
                      {item.date && (
                        <div className="text-xs text-muted-foreground mt-0.5 font-geist-regular">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-center text-muted-foreground font-geist-regular">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground font-geist-regular">
                      {currencyFormat(invoice.currency || "USD", item.rate)}
                    </div>
                    <div className="col-span-2 text-right font-geist-semibold">
                      {currencyFormat(invoice.currency || "USD", item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-96 space-y-3">
              <div className="flex justify-between text-sm font-geist-regular">
                <span className="text-muted-foreground font-geist-medium">Subtotal:</span>
                <span className="font-geist-medium">
                  {currencyFormat(
                    invoice.currency || "USD",
                    calculateSubtotal()
                  )}
                </span>
              </div>
              {(invoice.tax || 0) > 0 && (
                <div className="flex justify-between text-sm font-geist-regular">
                  <span className="text-muted-foreground font-geist-medium">
                    Tax ({invoice.tax}%):
                  </span>
                  <span className="font-geist-medium">
                    {currencyFormat(
                      invoice.currency || "USD",
                      calculateTaxAmount()
                    )}
                  </span>
                </div>
              )}
              {(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-sm font-geist-regular">
                  <span className="text-muted-foreground font-geist-medium">
                    Discount ({invoice.discount}%):
                  </span>
                  <span className="font-geist-medium">
                    -
                    {currencyFormat(
                      invoice.currency || "USD",
                      calculateDiscountAmount()
                    )}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-lg font-geist-bold">Total:</span>
                <span className="text-xl font-geist-bold">
                  {currencyFormat(invoice.currency || "USD", calculateTotal())}
                </span>
              </div>
              {invoice.status &&
                invoice.status !== "paid" &&
                invoice.status !== "draft" && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span className="font-geist-semibold">Amount Due:</span>
                    <span className="font-geist-bold">
                      {currencyFormat(
                        invoice.currency || "USD",
                        invoice.amountDue || calculateTotal()
                      )}
                    </span>
                  </div>
                )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Payment Instructions and Bank Details */}
          <div className="grid grid-cols-2 gap-6">
            {/* Bank Details */}
            <div className="border border-border rounded-lg p-4 bg-muted/10">
              <h3 className="text-xs font-geist-semibold text-foreground uppercase tracking-wider mb-3">
                BANK DETAILS
              </h3>
              <div className="text-sm space-y-2 font-geist-regular">
                <div>
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="ml-2 font-geist-medium">{invoice.company?.bankName || "Chase Bank"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="ml-2 font-geist-medium">{invoice.company?.name || "Miru Time Tracking LLC"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="ml-2 font-geist-medium font-mono">{invoice.company?.accountNumber || "****4567"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Routing Number:</span>
                  <span className="ml-2 font-geist-medium font-mono">{invoice.company?.routingNumber || "021000021"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SWIFT/BIC:</span>
                  <span className="ml-2 font-geist-medium font-mono">{invoice.company?.swiftCode || "CHASUS33"}</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="border border-border rounded-lg p-4 bg-muted/10">
              <h3 className="text-xs font-geist-semibold text-foreground uppercase tracking-wider mb-3">
                PAYMENT TERMS
              </h3>
              <div className="text-sm text-muted-foreground space-y-2 font-geist-regular">
                <p>
                  Payment is due within 30 days of invoice date. Late payments may incur
                  a {invoice.lateFee || "1.5%"} monthly interest charge.
                </p>
                <p>
                  Please include invoice number <span className="font-geist-semibold text-foreground">{invoice.invoiceNumber}</span> in
                  your payment reference.
                </p>
                <p className="mt-3 pt-3 border-t border-border font-geist-medium text-foreground">
                  Thank you for your business!
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          {!isPrintMode && (
            <div className="pt-6 mt-6 border-t border-border">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-geist-regular">
                <span>
                  Invoice generated on {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
                <span>
                  Page 1 of 1
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicePreview;
