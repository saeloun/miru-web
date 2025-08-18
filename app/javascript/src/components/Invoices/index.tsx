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
      const response = await invoiceApi.getInvoices();
      setInvoices(response.invoices);
      setSummary(response.summary);
      setRecentlyUpdatedInvoices(response.recentlyUpdatedInvoices);
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
        await invoiceApi.updateInvoice(invoiceData.id, invoiceData);
      } else {
        await invoiceApi.createInvoice(invoiceData);
      }

      await loadInvoices(); // Refresh the invoice list
      setViewMode("list");
    } catch (err) {
      setError("Failed to save invoice");
      console.error("Error saving invoice:", err);
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
      } else {
        await invoiceApi.updateInvoice(invoiceId, invoiceData);
      }

      // Then send the invoice
      const client = clients.find(c => c.id === invoiceData.clientId);
      if (client && invoiceId) {
        await invoiceApi.sendInvoice(invoiceId, {
          subject: `Invoice ${invoiceData.invoiceNumber}`,
          message: "Please find your invoice attached.",
          recipients: [client.email],
        });
      }

      await loadInvoices(); // Refresh the invoice list
      setViewMode("list");
    } catch (err) {
      setError("Failed to send invoice");
      console.error("Error sending invoice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoiceFromList = async (id: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) return;

      await invoiceApi.sendInvoice(id, {
        subject: `Invoice ${invoice.invoiceNumber}`,
        message: "Please find your invoice attached.",
        recipients: [invoice.client.email],
      });

      await loadInvoices(); // Refresh the invoice list
    } catch (err) {
      setError("Failed to send invoice");
      console.error("Error sending invoice:", err);
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
      const blob = await invoiceApi.downloadInvoice(id);
      const invoice = invoices.find(inv => inv.id === id);
      const filename = `invoice-${invoice?.invoiceNumber || id}.pdf`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download invoice");
      console.error("Error downloading invoice:", err);
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

      return (
        <div>
          {renderBackButton()}
          <InvoicePreview invoice={invoiceToPreview} />
        </div>
      );
    }

    default:
      return null;
  }
};

export default InvoicesPage;
