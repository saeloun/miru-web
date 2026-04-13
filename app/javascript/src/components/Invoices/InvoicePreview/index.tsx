import React, { useState } from "react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { currencyFormat } from "../../../helpers/currency";
import { format } from "date-fns";
import {
  Download,
  PaperPlaneTilt,
  Printer,
  PencilSimple,
} from "phosphor-react";
import { Button } from "../../ui/button";
import SendInvoice from "../common/InvoiceForm/SendInvoice";
import { cn } from "../../../lib/utils";
import { ApiStatus as InvoiceStatus } from "../../../constants";
import { invoiceApi } from "../../../services/invoiceApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { lineTotalCalc, minToHHMM } from "../../../helpers";
import { i18n } from "../../../i18n";

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
      vatNumber?: string;
      gstNumber?: string;
      bankName?: string;
      bankAccountNumber?: string;
      bankRoutingNumber?: string;
      bankSwiftCode?: string;
      baseCurrency: string;
    };
    lineItems: Array<{
      id: string;
      name?: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      date?: string;
    }>;
  };
  isEditing?: boolean;
  onAction?: (
    action: string,
    payload?: { subject: string; message: string; recipients: string[] }
  ) => Promise<void> | void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  isEditing = false,
  onAction,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<InvoiceStatus>(
    InvoiceStatus.IDLE
  );
  const navigate = useNavigate();
  const formatDate = (date: string | Date) => {
    if (!date) return "";

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return ""; // Return empty string for invalid dates
      }

      return format(dateObj, "MMM dd, yyyy");
    } catch (error) {
      console.warn("Invalid date format:", date);

      return "";
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return "";

    if (typeof address === "string") return address;

    if (typeof address === "object") {
      return [
        address.address_line_1 || address.addressLine1,
        address.address_line_2 || address.addressLine2,
        address.city,
        address.state,
        address.country,
        address.pin || address.postalCode || address.zipCode,
      ]
        .filter(Boolean)
        .join(", ");
    }

    return "";
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

  const formatQuantity = (quantity: number) => minToHHMM(Number(quantity) || 0);

  const formatLineAmount = (item: {
    amount?: number;
    quantity: number;
    rate: number;
  }) =>
    currencyFormat(
      currency,
      Number(item.amount ?? lineTotalCalc(item.quantity, item.rate))
    );

  const currency = invoice.currency || invoice.company.baseCurrency || "USD";

  const handleDownload = async () => {
    if (!invoice.id || invoice.id === "preview") {
      toast.error(i18n.t("invoices.cannotDownloadPreview"));

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

      toast.success(i18n.t("invoices.invoiceDownloaded"));
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(i18n.t("invoices.failedToDownload"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>,
    invoiceEmail: { subject: string; message: string; recipients: string[] }
  ) => {
    event.preventDefault();

    if (!invoice.id || invoice.id === "preview") {
      toast.error(i18n.t("invoices.cannotSendPreview"));

      return;
    }

    try {
      setSendStatus(InvoiceStatus.LOADING);

      if (onAction) {
        await onAction("send", invoiceEmail);
      } else {
        const isReminder = invoice.status === "overdue";
        const response = isReminder
          ? await invoiceApi.sendReminder(invoice.id, invoiceEmail)
          : await invoiceApi.sendInvoice(invoice.id, invoiceEmail);

        if (response && response.notice) {
          toast.success(response.notice);
        } else if (response && response.message) {
          toast.success(response.message);
        } else {
          toast.success(
            isReminder
              ? i18n.t("invoices.reminderSentSuccessfully")
              : i18n.t("invoices.invoiceSentSuccessfully")
          );
        }
      }

      setSendStatus(InvoiceStatus.SUCCESS);
      setIsSending(false);
    } catch (error: any) {
      setSendStatus(InvoiceStatus.ERROR);
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
        toast.error(i18n.t("invoices.failedToSend"));
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (!invoice.id || invoice.id === "preview") {
      toast.error(i18n.t("invoices.cannotEditPreview"));

      return;
    }
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleAction = async (action: string) => {
    if (onAction) {
      if (action === "send") {
        setSendStatus(InvoiceStatus.IDLE);
        setIsSending(true);

        return;
      }

      await onAction(action);
    } else {
      switch (action) {
        case "download":
          handleDownload();
          break;
        case "send":
          setSendStatus(InvoiceStatus.IDLE);
          setIsSending(true);
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
    <div className="w-full max-w-4xl mx-auto" data-testid="invoice-preview">
      {/* Action Bar */}
      {!isEditing && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAction("download")}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading
                ? i18n.t("invoices.downloading")
                : i18n.t("download")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAction("print")}
            >
              <Printer className="h-4 w-4 mr-2" />
              {i18n.t("print")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAction("edit")}
            >
              <PencilSimple className="h-4 w-4 mr-2" />
              {i18n.t("edit")}
            </Button>
            {invoice.status === "draft" && (
              <Button
                data-testid="invoice-preview-send-action"
                size="sm"
                className="bg-[#5E58F1] hover:bg-[#4D47E0]"
                onClick={() => void handleAction("send")}
                disabled={isSending}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                {isSending
                  ? i18n.t("invoices.sending")
                  : i18n.t("invoices.sendInvoice")}
              </Button>
            )}
            {(invoice.status === "sent" ||
              invoice.status === "overdue" ||
              invoice.status === "viewed") && (
              <Button
                data-testid="invoice-preview-reminder-action"
                size="sm"
                className="bg-[#5E58F1] hover:bg-[#4D47E0]"
                onClick={() => void handleAction("send")}
                disabled={isSending}
              >
                <PaperPlaneTilt className="h-4 w-4 mr-2" />
                {isSending
                  ? i18n.t("invoices.sending")
                  : i18n.t("invoices.sendReminder")}
              </Button>
            )}
          </div>
        </div>
      )}
      {isSending && (
        <SendInvoice
          handleSubmit={handleSendSubmit}
          invoice={invoice}
          isSendReminder={invoice.status === "overdue"}
          isSending={isSending}
          setIsSending={setIsSending}
          status={sendStatus}
        />
      )}

      {/* Invoice Preview Card */}
      <Card className="border-border bg-background p-4 text-foreground shadow-sm print:border-gray-200 print:bg-white print:text-gray-900 sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {invoice.company?.logo ? (
              <img
                src={invoice.company.logo}
                alt={invoice.company.name || "Company"}
                className="h-16 mb-4 object-contain"
              />
            ) : (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground print:text-gray-900">
                  {invoice.company?.name || i18n.t("company")}
                </h1>
              </div>
            )}
            <div className="space-y-1 break-words text-sm text-muted-foreground print:text-gray-600">
              {invoice.company.address && (
                <p>{formatAddress(invoice.company.address)}</p>
              )}
              {invoice.company.email && <p>{invoice.company.email}</p>}
              {invoice.company.phone && <p>{invoice.company.phone}</p>}
              {invoice.company.taxId && (
                <p>
                  {i18n.t("invoices.taxId", { value: invoice.company.taxId })}
                </p>
              )}
              {invoice.company.vatNumber && (
                <p>
                  {i18n.t("invoices.vatNumber", {
                    value: invoice.company.vatNumber,
                  })}
                </p>
              )}
              {invoice.company.gstNumber && (
                <p>
                  {i18n.t("invoices.gstNumber", {
                    value: invoice.company.gstNumber,
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h2 className="mb-2 text-3xl font-bold text-foreground print:text-gray-900">
              {i18n.t("invoices.invoice")}
            </h2>
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground print:text-gray-600">
                {i18n.t("invoices.invoiceNumber")}
              </p>
              <p className="text-lg font-semibold text-foreground print:text-gray-900">
                #{invoice.invoiceNumber}
              </p>
            </div>
            <div className="mt-4 text-sm space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground print:text-gray-600">
                  {i18n.t("invoices.issueDate")}:
                </span>
                <span className="font-medium text-foreground print:text-gray-900">
                  {formatDate(invoice.issueDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground print:text-gray-600">
                  {i18n.t("invoices.dueDate")}:
                </span>
                <span className="font-medium text-foreground print:text-gray-900">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {invoice.reference && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground print:text-gray-600">
                    {i18n.t("invoices.reference")}:
                  </span>
                  <span className="font-medium text-foreground print:text-gray-900">
                    {invoice.reference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-600">
            {i18n.t("invoices.billedTo")}
          </h3>
          <div className="space-y-1 break-words text-sm">
            <p className="text-lg font-semibold text-foreground print:text-gray-900">
              {invoice.client.name}
            </p>
            {invoice.client.address && (
              <p className="text-muted-foreground print:text-gray-600">
                {formatAddress(invoice.client.address)}
              </p>
            )}
            {invoice.client.email && (
              <p className="text-muted-foreground print:text-gray-600">
                {invoice.client.email}
              </p>
            )}
            {invoice.client.phone && (
              <p className="text-muted-foreground print:text-gray-600">
                {invoice.client.phone}
              </p>
            )}
            {invoice.client.taxId && (
              <p className="text-muted-foreground print:text-gray-600">
                {i18n.t("invoices.taxId", { value: invoice.client.taxId })}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <div className="space-y-3 sm:hidden">
            {invoice.lineItems.map((item, index) => (
              <div
                className="rounded-lg border border-border p-4"
                key={item.id || index}
              >
                <div className="space-y-1">
                  {item.name && (
                    <p className="whitespace-pre-wrap break-words text-sm font-semibold text-foreground print:text-gray-900">
                      {item.name}
                    </p>
                  )}
                  {item.description && (
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground print:text-gray-700">
                      {item.description}
                    </p>
                  )}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground print:text-gray-600">
                      {i18n.t("date")}
                    </dt>
                    <dd className="font-medium text-foreground print:text-gray-900">
                      {item.date ? formatDate(item.date) : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground print:text-gray-600">
                      {i18n.t("invoices.quantity")}
                    </dt>
                    <dd className="font-medium text-foreground print:text-gray-900">
                      {formatQuantity(item.quantity)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground print:text-gray-600">
                      {i18n.t("invoices.rate")}
                    </dt>
                    <dd className="font-medium text-foreground print:text-gray-900">
                      {currencyFormat(currency, item.rate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground print:text-gray-600">
                      {i18n.t("amount")}
                    </dt>
                    <dd className="font-medium text-foreground print:text-gray-900">
                      {formatLineAmount(item)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <div className="hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border print:border-gray-200">
                  <th className="px-2 py-3 text-left text-sm font-semibold text-foreground print:text-gray-700">
                    {i18n.t("description")}
                  </th>
                  <th className="px-2 py-3 text-center text-sm font-semibold text-foreground print:text-gray-700">
                    {i18n.t("date")}
                  </th>
                  <th className="px-2 py-3 text-center text-sm font-semibold text-foreground print:text-gray-700">
                    {i18n.t("invoices.quantity")}
                  </th>
                  <th className="px-2 py-3 text-right text-sm font-semibold text-foreground print:text-gray-700">
                    {i18n.t("invoices.rate")}
                  </th>
                  <th className="px-2 py-3 text-right text-sm font-semibold text-foreground print:text-gray-700">
                    {i18n.t("amount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="border-b border-border/70 print:border-gray-100"
                  >
                    <td className="px-2 py-3 text-sm text-foreground print:text-gray-900">
                      <div className="space-y-1">
                        {item.name && (
                          <p className="font-medium">{item.name}</p>
                        )}
                        {item.description && (
                          <p className="whitespace-pre-wrap break-words text-muted-foreground print:text-gray-600">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-muted-foreground print:text-gray-600">
                      {item.date ? formatDate(item.date) : "-"}
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-foreground print:text-gray-900">
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-2 py-3 text-right text-sm text-foreground print:text-gray-900">
                      {currencyFormat(currency, item.rate)}
                    </td>
                    <td className="px-2 py-3 text-right text-sm font-medium text-foreground print:text-gray-900">
                      {formatLineAmount(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mb-8 flex justify-end">
          <div className="w-full sm:w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground print:text-gray-600">
                  {i18n.t("invoices.subtotal")}
                </span>
                <span className="font-medium text-foreground print:text-gray-900">
                  {currencyFormat(currency, invoice.subtotal ?? invoice.amount)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground print:text-gray-600">
                    Discount
                  </span>
                  <span className="font-medium text-red-600">
                    -{currencyFormat(currency, invoice.discount)}
                  </span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground print:text-gray-600">
                    Tax
                  </span>
                  <span className="font-medium text-foreground print:text-gray-900">
                    {currencyFormat(currency, invoice.tax)}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between py-2">
                <span className="text-base font-semibold text-foreground print:text-gray-900">
                  {i18n.t("reports.totalDue")}
                </span>
                <span className="text-xl font-bold text-foreground print:text-gray-900">
                  {currencyFormat(currency, invoice.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-border pt-6 print:border-gray-200">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-600">
              {i18n.t("notes")}
            </h3>
            <p className="text-sm text-muted-foreground print:text-gray-600">
              {invoice.notes}
            </p>
          </div>
        )}

        {(invoice.company.bankName ||
          invoice.company.bankAccountNumber ||
          invoice.company.bankRoutingNumber ||
          invoice.company.bankSwiftCode) && (
          <div className="border-t border-border pt-6 print:border-gray-200">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-600">
              {i18n.t("reports.paymentDetails")}
            </h3>
            <div className="grid gap-2 text-sm text-muted-foreground print:text-gray-600 sm:grid-cols-2">
              {invoice.company.bankName && (
                <p>
                  {i18n.t("invoices.bankName", {
                    value: invoice.company.bankName,
                  })}
                </p>
              )}
              {invoice.company.bankAccountNumber && (
                <p>
                  {i18n.t("invoices.accountNumber", {
                    value: invoice.company.bankAccountNumber,
                  })}
                </p>
              )}
              {invoice.company.bankRoutingNumber && (
                <p>
                  {i18n.t("invoices.routingNumber", {
                    value: invoice.company.bankRoutingNumber,
                  })}
                </p>
              )}
              {invoice.company.bankSwiftCode && (
                <p>
                  {i18n.t("invoices.swiftCode", {
                    value: invoice.company.bankSwiftCode,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-6 print:border-gray-200">
          <div className="text-center text-xs text-muted-foreground print:text-gray-500">
            <p>{i18n.t("invoices.thankYouForBusiness")}</p>
            {isEditing && (
              <p className="mt-2 text-amber-600">
                {i18n.t("invoices.previewNote")}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvoicePreview;
