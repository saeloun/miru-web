import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { currencyFormat } from "helpers/currency";
import { format } from "date-fns";
import { Download, PaperPlaneTilt, Printer, Share2 } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InvoicePreviewProps {
  invoice: {
    id?: string;
    invoiceNumber: string;
    status: string;
    issueDate: string | Date;
    dueDate: string | Date;
    amount: number;
    tax: number;
    discount: number;
    subtotal: number;
    currency: string;
    reference?: string;
    notes?: string;
    client: {
      name: string;
      email: string;
      address?: string;
      phone?: string;
      taxId?: string;
    };
    company: {
      name: string;
      email: string;
      address?: string;
      phone?: string;
      logo?: string;
      taxId?: string;
      baseCurrency: string;
    };
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      date?: string;
    }>;
  };
  isEditing?: boolean;
  onAction?: (action: string) => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  isEditing = false,
  onAction,
}) => {
  const formatDate = (date: string | Date) => {
    if (!date) return "";

    return format(new Date(date), "MMM dd, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "sent":
      case "viewed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const currency = invoice.currency || invoice.company.baseCurrency || "USD";

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Action Bar */}
      {!isEditing && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={cn("capitalize", getStatusColor(invoice.status))}>
              {invoice.status}
            </Badge>
            {invoice.status === "overdue" && (
              <span className="text-sm text-red-600 font-medium">
                Overdue by{" "}
                {Math.floor(
                  (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction?.("download")}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction?.("print")}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction?.("share")}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {invoice.status === "draft" && (
              <Button
                size="sm"
                className="bg-[#5B34EA] hover:bg-[#4926D1]"
                onClick={() => onAction?.("send")}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Invoice Preview Card */}
      <Card className="bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {invoice.company?.logo ? (
              <img
                src={invoice.company.logo}
                alt={invoice.company.name || "Company"}
                className="h-16 mb-4 object-contain"
              />
            ) : (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {invoice.company?.name || "Company Name"}
                </h1>
              </div>
            )}
            <div className="text-sm text-gray-600 space-y-1">
              {invoice.company.address && (
                <p>
                  {typeof invoice.company.address === "object"
                    ? JSON.stringify(invoice.company.address)
                    : invoice.company.address}
                </p>
              )}
              {invoice.company.email && <p>{invoice.company.email}</p>}
              {invoice.company.phone && <p>{invoice.company.phone}</p>}
              {invoice.company.taxId && <p>Tax ID: {invoice.company.taxId}</p>}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
            <div className="text-sm space-y-1">
              <p className="text-gray-600">Invoice Number</p>
              <p className="font-semibold text-lg">#{invoice.invoiceNumber}</p>
            </div>
            <div className="mt-4 text-sm space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">
                  {formatDate(invoice.issueDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {invoice.reference && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium">{invoice.reference}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Bill To
          </h3>
          <div className="text-sm space-y-1">
            <p className="font-semibold text-lg text-gray-900">
              {invoice.client.name}
            </p>
            {invoice.client.address && (
              <p className="text-gray-600">
                {typeof invoice.client.address === "object"
                  ? JSON.stringify(invoice.client.address)
                  : invoice.client.address}
              </p>
            )}
            {invoice.client.email && (
              <p className="text-gray-600">{invoice.client.email}</p>
            )}
            {invoice.client.phone && (
              <p className="text-gray-600">{invoice.client.phone}</p>
            )}
            {invoice.client.taxId && (
              <p className="text-gray-600">Tax ID: {invoice.client.taxId}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                  Qty
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Rate
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="py-3 px-2 text-sm text-center text-gray-600">
                    {item.date ? formatDate(item.date) : "-"}
                  </td>
                  <td className="py-3 px-2 text-sm text-center text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-2 text-sm text-right text-gray-900">
                    {currencyFormat(currency, item.rate)}
                  </td>
                  <td className="py-3 px-2 text-sm text-right font-medium text-gray-900">
                    {currencyFormat(currency, item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {currencyFormat(currency, invoice.subtotal || invoice.amount)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">
                    -{currencyFormat(currency, invoice.discount)}
                  </span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">
                    {currencyFormat(currency, invoice.tax)}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between py-2">
                <span className="text-base font-semibold text-gray-900">
                  Total Due
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {currencyFormat(currency, invoice.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Notes
            </h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            {isEditing && (
              <p className="mt-2 text-amber-600">
                This is a preview. Changes will be reflected once saved.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvoicePreview;
