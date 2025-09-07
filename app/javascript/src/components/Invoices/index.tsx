import React, { useState, useEffect } from "react";
import InvoiceList from "./InvoiceList";
import InvoiceEditor from "./InvoiceEditor";
import InvoicePreview from "./InvoicePreview";
import { Button } from "../ui/button";
import { ArrowLeft } from "phosphor-react";
import {
  invoiceApi,
  Invoice,
  Client,
  InvoiceFormData,
} from "../../services/invoiceApi";
import { toast } from "sonner";

type ViewMode = "list" | "edit" | "create" | "preview";

interface InvoicesPageProps {
  initialMode?: ViewMode;
  initialInvoiceId?: string;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({
  initialMode = "list",
  initialInvoiceId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    initialInvoiceId || null
  );
  const [previewData, setPreviewData] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [recentlyUpdatedInvoices, setRecentlyUpdatedInvoices] = useState<
    Invoice[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInvoices();
    loadClients();

    // If we have an initial invoice ID, load that invoice
    if (
      initialInvoiceId &&
      (initialMode === "edit" || initialMode === "preview")
    ) {
      handleViewInvoice(initialInvoiceId);
    }
  }, [initialInvoiceId, initialMode]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      // Fetch more invoices to ensure we get all statuses including overdue
      const response = await invoiceApi.getInvoices({ per: 50 } as any);
      setInvoices(response.invoices);
      setSummary(response.summary);

      // Sort invoices by updated_at to get recently updated ones
      const sortedByUpdate = [...response.invoices].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.updated_at || 0).getTime();
        const dateB = new Date(b.updatedAt || b.updated_at || 0).getTime();

        return dateB - dateA; // Most recent first
      });
      setRecentlyUpdatedInvoices(sortedByUpdate.slice(0, 10));
    } catch (err) {
      setError("Failed to load invoices");
      console.error("Error loading invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientList = await invoiceApi.getClients();
      setClients(clientList);
    } catch (err) {
      console.error("Error loading clients:", err);
    }
  };

  const handleCreateInvoice = () => {
    setViewMode("create");
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
  };

  const handleViewInvoice = async (id: string) => {
    try {
      setIsLoading(true);
      const invoice = await invoiceApi.getInvoice(id);
      setSelectedInvoiceId(id);
      setSelectedInvoice(invoice);
      setViewMode("preview");
    } catch (err) {
      setError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = async (id: string) => {
    try {
      setIsLoading(true);
      const invoice = await invoiceApi.getInvoice(id);
      setSelectedInvoiceId(id);
      setSelectedInvoice(invoice);
      setViewMode("edit");
    } catch (err) {
      setError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (invoiceData: InvoiceFormData) => {
    // Convert form data to invoice preview format
    const client = clients.find(c => c.id === invoiceData.clientId);
    if (!client) return;

    const previewInvoice: Invoice = {
      id: invoiceData.id || "preview",
      invoiceNumber: invoiceData.invoiceNumber,
      client,
      status: invoiceData.status,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      amount: invoiceData.invoiceLineItems.reduce(
        (sum, item) => sum + item.amount,
        0
      ),
      currency: invoiceData.currency,
      tax: invoiceData.tax,
      discount: invoiceData.discount,
      reference: invoiceData.reference,
      invoiceLineItems: invoiceData.invoiceLineItems,
      company: {
        name: "Miru Time Tracking",
        baseCurrency: "USD",
        dateFormat: "MM/dd/yyyy",
      },
    };

    setPreviewData(previewInvoice);
    setViewMode("preview");
  };

  const handleSaveInvoice = async (invoiceData: InvoiceFormData) => {
    try {
      setIsLoading(true);

      if (invoiceData.id) {
        const response = await invoiceApi.updateInvoice(
          invoiceData.id,
          invoiceData
        );

        toast.success(
          response?.notice ||
            response?.message ||
            "Invoice updated successfully"
        );
      } else {
        const response = await invoiceApi.createInvoice(invoiceData);
        toast.success(
          response?.notice ||
            response?.message ||
            "Invoice created successfully"
        );
      }

      await loadInvoices(); // Refresh the invoice list
      setViewMode("list");
    } catch (err: any) {
      console.error("Error saving invoice:", err);

      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessage = Array.isArray(errors)
          ? errors.join(", ")
          : Object.values(errors).flat().join(", ");
        toast.error(errorMessage);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save invoice. Please try again.");
      }
      setError(null); // Don't show the error banner
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceData: InvoiceFormData) => {
    try {
      setIsLoading(true);

      // First save the invoice if it's new
      let invoiceId = invoiceData.id;
      if (!invoiceId) {
        const newInvoice = await invoiceApi.createInvoice(invoiceData);
        invoiceId = newInvoice.id;
        toast.success("Invoice created successfully");
      } else {
        await invoiceApi.updateInvoice(invoiceId, invoiceData);
        toast.success("Invoice updated successfully");
      }

      // Then send the invoice
      const client = clients.find(c => c.id === invoiceData.clientId);
      if (client && invoiceId) {
        const response = await invoiceApi.sendInvoice(invoiceId, {
          subject: `Invoice ${invoiceData.invoiceNumber}`,
          message: "Please find your invoice attached.",
          recipients: [client.email],
        });

        toast.success(
          response?.notice || response?.message || "Invoice sent successfully"
        );
      }

      await loadInvoices(); // Refresh the invoice list
      setViewMode("list");
    } catch (err: any) {
      console.error("Error sending invoice:", err);

      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessage = Array.isArray(errors)
          ? errors.join(", ")
          : Object.values(errors).flat().join(", ");
        toast.error(errorMessage);
      } else if (err.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to send invoice. Please try again.");
      }
      setError(null); // Don't show the error banner
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoiceFromList = async (id: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === id) || selectedInvoice;
      if (!invoice) {
        setError("Invoice not found");

        return;
      }

      const response = await invoiceApi.sendInvoice(id, {
        subject: `Invoice ${invoice.invoiceNumber}`,
        message: "Please find your invoice attached.",
        recipients: [invoice.client.email],
      });

      await loadInvoices(); // Refresh the invoice list
    } catch (err) {
      setError("Failed to send invoice");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const invoice = await invoiceApi.getInvoice(id);
      const updatedInvoice: InvoiceFormData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.client.id,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        reference: invoice.reference,
        invoiceLineItems: invoice.invoiceLineItems || [],
        tax: invoice.tax,
        discount: invoice.discount,
        currency: invoice.currency,
        status: "paid",
      };

      await invoiceApi.updateInvoice(id, updatedInvoice);
      await loadInvoices(); // Refresh the invoice list
    } catch (err) {
      setError("Failed to mark invoice as paid");
      console.error("Error marking invoice as paid:", err);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      // Find the invoice to get the invoice number
      const invoice = invoices.find(inv => inv.id === id) || selectedInvoice;
      const filename = `invoice-${invoice?.invoiceNumber || id}.pdf`;

      // Call the download API
      const blob = await invoiceApi.downloadInvoice(id);

      // Verify we got a blob
      if (!(blob instanceof Blob)) {
        throw new Error("Invalid response from server - expected PDF blob");
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      setError("Failed to download invoice");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
    setPreviewData(null);
    setError(null);
  };

  const renderBackButton = () => (
    <Button variant="outline" onClick={handleBackToList} className="mb-6">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Invoices
    </Button>
  );

  // Show error message if there's an error
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              loadInvoices();
            }}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  switch (viewMode) {
    case "list":
      return (
        <InvoiceList
          invoices={invoices}
          summary={summary}
          recentlyUpdatedInvoices={recentlyUpdatedInvoices}
          onCreateInvoice={handleCreateInvoice}
          onViewInvoice={handleViewInvoice}
          onSendInvoice={handleSendInvoiceFromList}
          onMarkPaid={handleMarkPaid}
          onDownload={handleDownload}
          isLoading={isLoading}
        />
      );

    case "create":
      return (
        <div>
          {renderBackButton()}
          <InvoiceEditor
            clients={clients}
            company={{
              name: "Miru Time Tracking",
              email: "support@getmiru.com",
              baseCurrency: "USD",
              dateFormat: "MM/dd/yyyy",
              address: "",
              phone: "",
              taxId: "",
            }}
            onSave={handleSaveInvoice}
            onSend={handleSendInvoice}
            onPreview={handlePreview}
            onCancel={handleBackToList}
            isLoading={isLoading}
          />
        </div>
      );

    case "edit": {
      if (!selectedInvoice) return null;

      const editFormData: InvoiceFormData = {
        id: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        clientId: selectedInvoice.client.id,
        issueDate: selectedInvoice.issueDate,
        dueDate: selectedInvoice.dueDate,
        reference: selectedInvoice.reference,
        invoiceLineItems: selectedInvoice.invoiceLineItems || [],
        tax: selectedInvoice.tax,
        discount: selectedInvoice.discount,
        currency: selectedInvoice.currency,
        status: selectedInvoice.status,
      };

      return (
        <div>
          {renderBackButton()}
          <InvoiceEditor
            invoice={editFormData}
            clients={clients}
            company={
              selectedInvoice.company || {
                name: "Miru Time Tracking",
                email: "support@getmiru.com",
                baseCurrency: "USD",
                dateFormat: "MM/dd/yyyy",
                address: "",
                phone: "",
                taxId: "",
              }
            }
            onSave={handleSaveInvoice}
            onSend={handleSendInvoice}
            onPreview={handlePreview}
            onCancel={handleBackToList}
            isLoading={isLoading}
          />
        </div>
      );
    }

    case "preview": {
      const invoiceToPreview = previewData || selectedInvoice;
      if (!invoiceToPreview) return null;

      const handleInvoiceAction = async (action: string) => {
        switch (action) {
          case "download":
            if (invoiceToPreview.id && invoiceToPreview.id !== "preview") {
              await handleDownload(invoiceToPreview.id);
            } else {
              setError("Cannot download invoice - invalid ID");
            }
            break;
          case "send":
            if (invoiceToPreview.id && invoiceToPreview.id !== "preview") {
              await handleSendInvoiceFromList(invoiceToPreview.id);
            } else {
              setError("Cannot send invoice - invalid ID");
            }
            break;
          case "edit":
            if (invoiceToPreview.id) {
              await handleEditInvoice(invoiceToPreview.id);
            }
            break;
          case "print":
            window.print();
            break;
          case "share":
            // Share functionality can be implemented later
            break;
        }
      };

      // Convert invoiceLineItems to lineItems for InvoicePreview
      const previewInvoice = {
        ...invoiceToPreview,
        lineItems: invoiceToPreview.invoiceLineItems || [],
        subtotal:
          invoiceToPreview.invoiceLineItems?.reduce(
            (sum, item) => sum + item.amount,
            0
          ) || invoiceToPreview.amount,
        company: invoiceToPreview.company || {
          name: "Miru Time Tracking",
          email: "support@getmiru.com",
          baseCurrency: "USD",
          dateFormat: "MM/dd/yyyy",
        },
      };

      return (
        <div>
          {renderBackButton()}
          <InvoicePreview
            invoice={previewInvoice}
            onAction={handleInvoiceAction}
          />
        </div>
      );
    }

    default:
      return null;
  }
};

export default InvoicesPage;
