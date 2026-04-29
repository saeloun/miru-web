import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceList from "./InvoiceList";
import InvoiceEditor from "./InvoiceEditor/index";
import InvoicePreview from "./InvoicePreview";
import MarkInvoiceAsPaidModal from "./Invoice/MarkInvoicePaidModal";
import WaiveOffInvoice from "./popups/WavieOffInvoice";
import { Button } from "../ui/button";
import { ArrowLeft } from "phosphor-react";
import {
  invoiceApi,
  Invoice,
  Client,
  InvoiceFormData,
} from "../../services/invoiceApi";
import { useUserContext } from "../../context/UserContext";
import { toast } from "sonner";
import { usePaginatedInvoices } from "./usePaginatedInvoices";
import { lineTotalCalc } from "../../helpers";
import { i18n } from "../../i18n";

type ViewMode = "list" | "edit" | "create" | "preview";

interface InvoicesPageProps {
  initialMode?: ViewMode;
  initialInvoiceId?: string;
  initialClientId?: string;
}

type InvoiceEmailPayload = {
  subject: string;
  message: string;
  recipients: string[];
};

const InvoicesPage: React.FC<InvoicesPageProps> = ({
  initialMode = "list",
  initialInvoiceId,
  initialClientId,
}) => {
  const resolveLineAmount = (item: {
    amount?: number;
    quantity: number;
    rate: number;
  }) => Number(item.amount ?? lineTotalCalc(item.quantity, item.rate));

  const navigate = useNavigate();
  const { company: currentCompany } = useUserContext();
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    initialInvoiceId || null
  );
  const [previewData, setPreviewData] = useState<Invoice | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showWaiveDialog, setShowWaiveDialog] = useState(false);
  const [invoiceToWaive, setInvoiceToWaive] = useState<string | null>(null);
  const [invoiceToWaiveNumber, setInvoiceToWaiveNumber] = useState<
    string | null
  >(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const {
    invoices,
    totalInvoices,
    summary,
    isLoading: isListLoading,
    isLoadingMore,
    hasMoreInvoices,
    error: listError,
    clearError: clearListError,
    loadInvoices,
    loadMoreInvoices,
  } = usePaginatedInvoices();
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const error = pageError || listError;
  const clearError = () => {
    setPageError(null);
    clearListError();
  };

  const invoiceRequestErrorMessage = (err: any, fallback: string) => {
    if (err.response?.data?.error) {
      return err.response.data.error;
    }

    if (err.response?.data?.errors) {
      const errors = err.response.data.errors;

      return Array.isArray(errors)
        ? errors.join(", ")
        : Object.values(errors).flat().join(", ");
    }

    return err.message || fallback;
  };

  const syncInvoiceState = (invoice: Invoice) => {
    if (String(selectedInvoiceId) === String(invoice.id)) {
      setSelectedInvoice(invoice);
    }

    if (String(previewData?.id) === String(invoice.id)) {
      setPreviewData(invoice);
    }
  };

  const fallbackCompany = {
    name: currentCompany?.name || "Company Name",
    email: currentCompany?.email || "",
    baseCurrency:
      currentCompany?.baseCurrency || currentCompany?.base_currency || "USD",
    dateFormat:
      currentCompany?.dateFormat || currentCompany?.date_format || "MM/dd/yyyy",
    address: currentCompany?.address || "",
    phone:
      currentCompany?.phone ||
      currentCompany?.phone_number ||
      currentCompany?.businessPhone ||
      currentCompany?.business_phone ||
      "",
    taxId: currentCompany?.taxId || currentCompany?.tax_id || "",
    vatNumber: currentCompany?.vatNumber || currentCompany?.vat_number || "",
    gstNumber: currentCompany?.gstNumber || currentCompany?.gst_number || "",
    bankName: currentCompany?.bankName || currentCompany?.bank_name || "",
    bankAccountNumber:
      currentCompany?.bankAccountNumber ||
      currentCompany?.bank_account_number ||
      "",
    bankRoutingNumber:
      currentCompany?.bankRoutingNumber ||
      currentCompany?.bank_routing_number ||
      "",
    bankSwiftCode:
      currentCompany?.bankSwiftCode || currentCompany?.bank_swift_code || "",
    logo: currentCompany?.logo || "",
  };

  // Load initial data
  useEffect(() => {
    loadInvoices();
    loadClients();

    if (!initialInvoiceId) return;

    if (initialMode === "edit") {
      handleEditInvoice(initialInvoiceId);

      return;
    }

    if (initialMode === "preview") {
      handleViewInvoice(initialInvoiceId);
    }
  }, [initialInvoiceId, initialMode, loadInvoices]);

  const loadClients = async () => {
    try {
      const clientList = await invoiceApi.getClients();
      // Format client addresses to ensure they're strings
      const formattedClients = clientList.map(client => ({
        ...client,
        address:
          typeof client.address === "object" && client.address
            ? [
                client.address.address_line_1,
                client.address.address_line_2,
                client.address.city,
                client.address.state,
                client.address.country,
                client.address.pin,
              ]
                .filter(Boolean)
                .join(", ")
            : client.address || "",
      }));
      setClients(formattedClients);
    } catch (err) {
      console.error("Error loading clients:", err);
    }
  };

  const handleCreateInvoice = () => {
    setViewMode("create");
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
    setPreviewData(null);
    navigate("/invoices/new");
  };

  const handleViewInvoice = async (id: string) => {
    try {
      setIsLoading(true);
      const invoice = await invoiceApi.getInvoice(id);
      setSelectedInvoiceId(id);
      setSelectedInvoice(invoice);
      setViewMode("preview");
      navigate(`/invoices/${id}`);
    } catch (err) {
      setPageError("Failed to load invoice");
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
      navigate(`/invoices/${id}/edit`);
    } catch (err) {
      setPageError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (invoiceData: InvoiceFormData) => {
    // Convert form data to invoice preview format
    const client = clients.find(
      c => String(c.id) === String(invoiceData.clientId)
    );
    if (!client) return;

    const previewInvoice: Invoice = {
      id: invoiceData.id || "preview",
      invoiceNumber: invoiceData.invoiceNumber,
      client,
      status: invoiceData.status,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      amount: invoiceData.invoiceLineItems.reduce(
        (sum, item) => sum + resolveLineAmount(item),
        0
      ),
      currency: invoiceData.currency,
      tax: invoiceData.tax,
      discount: invoiceData.discount,
      reference: invoiceData.reference,
      invoiceLineItems: invoiceData.invoiceLineItems,
      company: {
        name: fallbackCompany.name,
        email: fallbackCompany.email,
        baseCurrency: fallbackCompany.baseCurrency,
        dateFormat: fallbackCompany.dateFormat,
        address: fallbackCompany.address,
        phone: fallbackCompany.phone,
        taxId: fallbackCompany.taxId,
        vatNumber: fallbackCompany.vatNumber,
        gstNumber: fallbackCompany.gstNumber,
        bankName: fallbackCompany.bankName,
        bankAccountNumber: fallbackCompany.bankAccountNumber,
        bankRoutingNumber: fallbackCompany.bankRoutingNumber,
        bankSwiftCode: fallbackCompany.bankSwiftCode,
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
        setSelectedInvoiceId(response.id);
        setSelectedInvoice(response);
        setPreviewData(response);
        setViewMode("edit");
        navigate(`/invoices/${response.id}/edit`);

        toast.success(
          response?.notice ||
            response?.message ||
            i18n.t("invoices.invoiceUpdated")
        );
      } else {
        const response = await invoiceApi.createInvoice(invoiceData);
        setSelectedInvoiceId(response.id);
        setSelectedInvoice(response);
        setPreviewData(response);
        setViewMode("edit");
        navigate(`/invoices/${response.id}/edit`);
        toast.success(
          response?.notice ||
            response?.message ||
            i18n.t("invoices.invoiceCreated")
        );
      }

      await loadInvoices(); // Refresh the invoice list
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
        toast.error(i18n.t("invoices.failedToSaveInvoice"));
      }
      clearError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceData: InvoiceFormData) => {
    let savedInvoice: Invoice | null = null;

    try {
      setIsLoading(true);

      const client = clients.find(
        c => String(c.id) === String(invoiceData.clientId)
      );
      if (!client) {
        toast.error(i18n.t("invoices.selectClientBeforeSending"));

        return;
      }

      const invoiceDataForSave = {
        ...invoiceData,
        status: selectedInvoice?.status || "draft",
      };

      // First save the invoice if it's new
      let invoiceId = invoiceData.id;
      if (!invoiceId) {
        const newInvoice = await invoiceApi.createInvoice(invoiceDataForSave);
        invoiceId = newInvoice.id;
        savedInvoice = newInvoice;
        setSelectedInvoiceId(newInvoice.id);
        setSelectedInvoice(newInvoice);
        setPreviewData(newInvoice);
      } else {
        const updatedInvoice = await invoiceApi.updateInvoice(
          invoiceId,
          invoiceDataForSave
        );
        savedInvoice = updatedInvoice;
        setSelectedInvoiceId(updatedInvoice.id);
        setSelectedInvoice(updatedInvoice);
        setPreviewData(updatedInvoice);
      }

      // Then send the invoice
      if (invoiceId) {
        const response = await invoiceApi.sendInvoice(invoiceId, {
          subject: `Invoice ${invoiceData.invoiceNumber}`,
          message: "Please find your invoice attached.",
          recipients: [client.email],
        });

        toast.success(
          response?.notice ||
            response?.message ||
            i18n.t("invoices.invoiceSentSuccessfully")
        );
        const refreshedInvoice = await invoiceApi.getInvoice(invoiceId);
        setSelectedInvoiceId(refreshedInvoice.id);
        setSelectedInvoice(refreshedInvoice);
        setPreviewData(refreshedInvoice);
        setViewMode("preview");
        navigate(`/invoices/${invoiceId}`);
      }

      await loadInvoices(); // Refresh the invoice list
    } catch (err: any) {
      console.error("Error sending invoice:", err);

      if (savedInvoice) {
        setSelectedInvoiceId(savedInvoice.id);
        setSelectedInvoice(savedInvoice);
        setPreviewData(savedInvoice);
        setViewMode("edit");
        navigate(`/invoices/${savedInvoice.id}/edit`);
      }

      toast.error(
        invoiceRequestErrorMessage(err, i18n.t("invoices.failedToSend"))
      );
      clearError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoiceFromList = async (
    id: string,
    invoiceEmail?: InvoiceEmailPayload
  ) => {
    try {
      const invoice = invoices.find(inv => inv.id === id) || selectedInvoice;
      if (!invoice) {
        setPageError("Invoice not found");

        return;
      }

      const response = await invoiceApi.sendInvoice(
        id,
        invoiceEmail || {
          subject: `Invoice ${invoice.invoiceNumber}`,
          message: "Please find your invoice attached.",
          recipients: [invoice.client.email],
        }
      );

      toast.success(
        response?.message || i18n.t("invoices.invoiceSentSuccessfully")
      );

      if (
        String(selectedInvoiceId) === String(id) ||
        String(previewData?.id) === String(id)
      ) {
        const refreshedInvoice = await invoiceApi.getInvoice(id);
        syncInvoiceState(refreshedInvoice);
      }
      await loadInvoices(); // Refresh the invoice list
    } catch (err: any) {
      toast.error(
        invoiceRequestErrorMessage(err, i18n.t("invoices.failedToSend"))
      );
      err.toastHandled = true;
      throw err;
    }
  };

  const handleDeleteInvoiceFromList = async (id: string) => {
    if (!id) return;

    const shouldDelete = window.confirm(
      i18n.t("invoices.deleteInvoiceConfirm")
    );
    if (!shouldDelete) return;

    try {
      setIsLoading(true);
      await invoiceApi.deleteInvoice(id);

      if (
        String(selectedInvoiceId) === String(id) ||
        String(previewData?.id) === String(id)
      ) {
        setSelectedInvoiceId(null);
        setSelectedInvoice(null);
        setPreviewData(null);
        setViewMode("list");
      }

      await loadInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      toast.error(i18n.t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminderFromList = async (
    id: string,
    invoiceEmail?: InvoiceEmailPayload
  ) => {
    try {
      const invoice = invoices.find(inv => inv.id === id) || selectedInvoice;
      if (!invoice) {
        setPageError("Invoice not found");

        return;
      }

      const response = await invoiceApi.sendReminder(
        id,
        invoiceEmail || {
          subject: `Reminder to complete payment for invoice ${invoice.invoiceNumber}`,
          message:
            "This is a reminder about your overdue invoice. Please complete payment.",
          recipients: [invoice.client.email],
        }
      );

      toast.success(
        response?.message || i18n.t("invoices.reminderSentSuccessfully")
      );

      await loadInvoices();
    } catch (err: any) {
      toast.error(
        invoiceRequestErrorMessage(err, i18n.t("invoices.failedToSend"))
      );
      err.toastHandled = true;
      throw err;
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoiceApi.getInvoice(invoice.id);
      setMarkPaidInvoice(fullInvoice);
      setShowMarkPaidModal(true);
    } catch (err) {
      setPageError("Failed to mark invoice as paid");
      console.error("Error marking invoice as paid:", err);
    }
  };

  const handleWaiveInvoice = (invoice: Invoice) => {
    setInvoiceToWaive(invoice.id);
    setInvoiceToWaiveNumber(invoice.invoiceNumber);
    setShowWaiveDialog(true);
  };

  const refreshWaivedInvoice = async () => {
    if (invoiceToWaive) {
      const refreshedInvoice = await invoiceApi.getInvoice(invoiceToWaive);
      syncInvoiceState(refreshedInvoice);
    }

    await loadInvoices();
  };

  const refreshMarkedInvoice = async () => {
    if (!markPaidInvoice?.id) return;

    const refreshedInvoice = await invoiceApi.getInvoice(markPaidInvoice.id);
    syncInvoiceState(refreshedInvoice);
    await loadInvoices();
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
      setPageError("Failed to download invoice");
      console.error("Error downloading invoice:", err);
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
    setPreviewData(null);
    clearError();
    navigate("/invoices");
  };

  const printInvoiceView = () => {
    const elementsToHide = Array.from(
      document.querySelectorAll<HTMLElement>(".invoice-print-hide")
    );
    const previousDisplayValues = elementsToHide.map(el => el.style.display);
    let restored = false;

    const restoreVisibility = () => {
      if (restored) return;
      restored = true;
      elementsToHide.forEach((el, index) => {
        el.style.display = previousDisplayValues[index];
      });
      window.removeEventListener("afterprint", restoreVisibility);
    };

    elementsToHide.forEach(el => {
      el.style.display = "none";
    });

    window.addEventListener("afterprint", restoreVisibility, { once: true });
    window.print();
    window.setTimeout(restoreVisibility, 1000);
  };

  const renderBackButton = () => (
    <Button
      variant="outline"
      onClick={handleBackToList}
      className="invoice-print-hide mb-6"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {i18n.t("invoices.backToInvoices")}
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
              clearError();
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

  let view = null;

  switch (viewMode) {
    case "list":
      view = (
        <InvoiceList
          invoices={invoices}
          totalInvoices={totalInvoices}
          summary={summary}
          onCreateInvoice={handleCreateInvoice}
          onViewInvoice={handleViewInvoice}
          onSendInvoice={handleSendInvoiceFromList}
          onSendReminder={handleSendReminderFromList}
          onMarkPaid={handleMarkPaid}
          onWaive={handleWaiveInvoice}
          onDownload={handleDownload}
          onDelete={handleDeleteInvoiceFromList}
          onLoadMore={loadMoreInvoices}
          isLoading={isListLoading || isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMoreInvoices}
        />
      );
      break;

    case "create":
      view = (
        <div>
          {renderBackButton()}
          <InvoiceEditor
            clients={clients}
            company={fallbackCompany}
            initialClientId={initialClientId}
            onSave={handleSaveInvoice}
            onSend={handleSendInvoice}
            onPreview={handlePreview}
            onCancel={handleBackToList}
            isLoading={isLoading}
          />
        </div>
      );
      break;

    case "edit": {
      if (!selectedInvoice) break;

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

      // Format company address if it's an object
      const formattedCompany = selectedInvoice.company
        ? {
            ...selectedInvoice.company,
            address:
              typeof selectedInvoice.company.address === "object"
                ? [
                    selectedInvoice.company.address.address_line_1,
                    selectedInvoice.company.address.address_line_2,
                    selectedInvoice.company.address.city,
                    selectedInvoice.company.address.state,
                    selectedInvoice.company.address.country,
                    selectedInvoice.company.address.pin,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : selectedInvoice.company.address || "",
          }
        : {
            ...fallbackCompany,
          };

      view = (
        <div>
          {renderBackButton()}
          <InvoiceEditor
            invoice={editFormData}
            clients={clients}
            company={formattedCompany}
            onSave={handleSaveInvoice}
            onSend={handleSendInvoice}
            onPreview={handlePreview}
            onCancel={handleBackToList}
            isLoading={isLoading}
          />
        </div>
      );
      break;
    }

    case "preview": {
      const invoiceToPreview = previewData || selectedInvoice;
      if (!invoiceToPreview) break;

      const handleInvoiceAction = async (
        action: string,
        payload?: { subject: string; message: string; recipients: string[] }
      ) => {
        switch (action) {
          case "download":
            if (invoiceToPreview.id && invoiceToPreview.id !== "preview") {
              await handleDownload(invoiceToPreview.id);
            } else {
              setPageError("Cannot download invoice - invalid ID");
            }
            break;
          case "send":
            if (invoiceToPreview.id && invoiceToPreview.id !== "preview") {
              if (invoiceToPreview.status === "overdue") {
                await handleSendReminderFromList(invoiceToPreview.id, payload);
              } else {
                await handleSendInvoiceFromList(invoiceToPreview.id, payload);
              }
            } else {
              setPageError("Cannot send invoice - invalid ID");
            }
            break;
          case "edit":
            if (invoiceToPreview.id) {
              await handleEditInvoice(invoiceToPreview.id);
            }
            break;
          case "mark_paid":
            if (invoiceToPreview.id) {
              await handleMarkPaid(invoiceToPreview as Invoice);
            }
            break;
          case "waive":
            if (invoiceToPreview.id) {
              handleWaiveInvoice(invoiceToPreview as Invoice);
            }
            break;
          case "print":
            printInvoiceView();
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
          invoiceToPreview.invoiceLineItems &&
          invoiceToPreview.invoiceLineItems.length > 0
            ? invoiceToPreview.invoiceLineItems.reduce(
                (sum, item) => sum + resolveLineAmount(item),
                0
              )
            : invoiceToPreview.amount,
        company: invoiceToPreview.company || {
          ...fallbackCompany,
        },
      };

      view = (
        <div>
          {renderBackButton()}
          <InvoicePreview
            invoice={previewInvoice}
            onAction={handleInvoiceAction}
          />
        </div>
      );
      break;
    }

    default:
      break;
  }

  return (
    <>
      {view}
      {showMarkPaidModal && markPaidInvoice?.company && (
        <MarkInvoiceAsPaidModal
          baseCurrency={markPaidInvoice.company.baseCurrency}
          dateFormat={markPaidInvoice.company.dateFormat}
          fetchInvoice={refreshMarkedInvoice}
          invoice={markPaidInvoice}
          setShowManualEntryModal={setShowMarkPaidModal}
          showManualEntryModal={showMarkPaidModal}
        />
      )}
      {showWaiveDialog && invoiceToWaive && (
        <WaiveOffInvoice
          fetchInvoices={refreshWaivedInvoice}
          invoice={invoiceToWaive}
          invoiceNumber={invoiceToWaiveNumber}
          setShowWaiveDialog={setShowWaiveDialog}
          showWaiveDialog={showWaiveDialog}
        />
      )}
    </>
  );
};

export default InvoicesPage;
