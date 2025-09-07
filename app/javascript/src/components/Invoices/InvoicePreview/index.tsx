import React, { useState } from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { currencyFormat } from "../../../helpers/currency";
import { format } from "date-fns";
import { Download, PaperPlaneTilt, Printer, PencilSimple } from "phosphor-react";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { invoiceApi } from "../../../services/invoiceApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
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

  const handleDownload = async () => {
    if (!invoice.id || invoice.id === "preview") {
      toast.error("Cannot download preview invoice");
      return;
    }
    
    setIsDownloading(true);
    try {
      const blob = await invoiceApi.downloadInvoice(invoice.id);
      
      if (!(blob instanceof Blob)) {
        throw new Error("Invalid response from server");
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSend = async () => {
    if (!invoice.id || invoice.id === "preview") {
      toast.error("Cannot send preview invoice");
      return;
    }
    
    setIsSending(true);
    try {
      const subject = invoice.status === "draft" 
        ? `Invoice ${invoice.invoiceNumber}`
        : `Invoice Reminder: ${invoice.invoiceNumber}`;
      
      const message = invoice.status === "draft"
        ? "Please find your invoice attached."
        : "This is a reminder about your outstanding invoice. Please find the details attached.";
      
      const response = await invoiceApi.sendInvoice(invoice.id, {
        subject,
        message,
        recipients: [invoice.client.email],
      });
      
      if (response && response.notice) {
        toast.success(response.notice);
      } else if (response && response.message) {
        toast.success(response.message);
      } else {
        toast.success(
          invoice.status === "draft" 
            ? "Invoice sent successfully" 
            : "Reminder sent successfully"
        );
      }
    } catch (error: any) {
      console.error("Send failed:", error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessage = Array.isArray(errors) 
          ? errors.join(", ") 
          : Object.values(errors).flat().join(", ");
        toast.error(errorMessage);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send invoice. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (!invoice.id || invoice.id === "preview") {
      toast.error("Cannot edit preview invoice");
      return;
    }
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    } else {
      switch (action) {
        case "download":
          handleDownload();
          break;
        case "send":
          handleSend();
          break;
        case "print":
          handlePrint();
          break;
        case "edit":
          handleEdit();
          break;
      }
    }
  };

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
              onClick={() => handleAction("download")}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("print")}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("edit")}
            >
              <PencilSimple className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {invoice.status === "draft" && (
              <Button
                size="sm"
                className="bg-[#5B34EA] hover:bg-[#4926D1]"
                onClick={() => handleAction("send")}
                disabled={isSending}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Invoice"}
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "viewed") && (
              <Button
                size="sm"
                className="bg-[#5B34EA] hover:bg-[#4926D1]"
                onClick={() => handleAction("send")}
                disabled={isSending}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Reminder"}
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
