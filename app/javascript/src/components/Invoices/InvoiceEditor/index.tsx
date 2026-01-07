import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { Badge } from "../../ui/badge";
import { Checkbox } from "../../ui/checkbox";
import { cn } from "../../../lib/utils";
import { format } from "date-fns";
import { Calendar } from "../../ui/calendar";
import {
  CalendarBlank as CalendarIcon,
  Plus,
  Trash,
  FloppyDisk,
  PaperPlaneTilt,
  Eye,
  EyeSlash,
  Clock,
  Check,
  X,
} from "phosphor-react";
import { generateInvoice } from "../../../apis/api";
import InvoiceTable from "../common/InvoiceTable";
import { minToHHMM } from "../../../helpers";
import InvoicePreview from "../InvoicePreview";
import { fetchNewLineItems } from "../common/utils";

interface InvoiceEditorProps {
  invoice?: any;
  clients: any[];
  company?: any;
  onSave?: (invoice: any) => void;
  onSend?: (invoice: any) => void;
  onPreview?: (invoice: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  clients,
  company = {
    name: "Miru Time Tracking",
    email: "support@getmiru.com",
    baseCurrency: "USD",
    dateFormat: "MM/dd/yyyy",
    address: "",
    phone: "",
    taxId: "",
  },
  onSave,
  onSend,
  onPreview,
  onCancel,
  isLoading = false,
}) => {
  const [showPreview, setShowPreview] = useState(true);
  // Helper function to ensure valid Date object
  const ensureValidDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date && !isNaN(date.getTime())) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now()}`,
    status: invoice?.status || "draft",
    clientId: invoice?.clientId || "",
    issueDate: ensureValidDate(invoice?.issueDate),
    dueDate: ensureValidDate(
      invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ),
    reference: invoice?.reference || "",
    notes: invoice?.notes || "",
    discount: invoice?.discount || 0,
    tax: invoice?.tax || 0,
  });
  
  const [lineItems, setLineItems] = useState([]);
  const [selectedLineItems, setSelectedLineItems] = useState(
    invoice?.invoiceLineItems || invoice?.lineItems || []
  );
  const [manualEntryArr, setManualEntryArr] = useState([]);
  
  const [hasChanges, setHasChanges] = useState(false);

  const selectedClient = useMemo(() => {
    const client = clients.find(c => c.id === formData.clientId);
    if (!client) {
      return {
        name: "Select a client",
        email: "",
        address: "",
        phone: "",
        taxId: "",
      };
    }

    // Ensure address is a string
    const formattedClient = { ...client };
    if (
      formattedClient.address &&
      typeof formattedClient.address === "object"
    ) {
      const addr = formattedClient.address;
      formattedClient.address = [
        addr.address_line_1,
        addr.address_line_2,
        addr.city,
        addr.state,
        addr.country,
        addr.pin,
      ]
        .filter(Boolean)
        .join(", ");
    }

    return formattedClient;
  }, [formData.clientId, clients]);

  useEffect(() => {
    setHasChanges(true);
  }, [formData, selectedLineItems, manualEntryArr]);

  useEffect(() => {
    if (selectedClient && selectedClient.id) {
      fetchNewLineItems(selectedClient, setLineItems, selectedLineItems);
    }
  }, [selectedClient?.id]);



  const subtotal = useMemo(
    () => {
      const selectedTotal = selectedLineItems.reduce((sum, item) => {
        if (!item._destroy) {
          return sum + (item.lineTotal || item.amount || (item.quantity * item.rate) || 0);
        }
        return sum;
      }, 0);
      const manualTotal = manualEntryArr.reduce((sum, item) => {
        if (!item._destroy) {
          return sum + (item.lineTotal || item.amount || (item.quantity * item.rate) || 0);
        }
        return sum;
      }, 0);
      return selectedTotal + manualTotal;
    },
    [selectedLineItems, manualEntryArr]
  );

  const total = useMemo(
    () => subtotal - formData.discount + formData.tax,
    [subtotal, formData.discount, formData.tax]
  );


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

  const previewInvoice = {
    ...formData,
    amount: total,
    subtotal,
    currency: company?.baseCurrency || "USD",
    client: selectedClient,
    lineItems: [...selectedLineItems, ...manualEntryArr].filter(item => !item._destroy),
    company: company
      ? {
          name: company.name || "Company Name",
          email: company.email || "",
          phone: company.phone || "",
          taxId: company.taxId || "",
          baseCurrency: company.baseCurrency || "USD",
          address: formatAddress(company.address),
          logo: company.logo || "",
        }
      : {
          name: "Company Name",
          email: "",
          phone: "",
          taxId: "",
          baseCurrency: "USD",
          address: "",
          logo: "",
        },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {invoice ? "Edit Invoice" : "Create Invoice"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the details and preview your invoice in real-time
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="lg:hidden"
              >
                {showPreview ? (
                  <EyeSlash className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => onSave && onSave({
                  ...formData,
                  invoiceLineItems: [...selectedLineItems, ...manualEntryArr].filter(item => !item._destroy)
                })}
                variant="outline"
                size="sm"
                disabled={isLoading || !hasChanges}
              >
                <FloppyDisk className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
                <span className="sm:hidden">Save</span>
              </Button>
              <Button
                onClick={() =>
                  onSend && onSend({ 
                    ...formData, 
                    status: "sent",
                    invoiceLineItems: [...selectedLineItems, ...manualEntryArr].filter(item => !item._destroy)
                  })
                }
                className="bg-[#5B34EA] hover:bg-[#4926D1]"
                size="sm"
                disabled={isLoading}
              >
                <PaperPlaneTilt className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Send Invoice</span>
                <span className="sm:hidden">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 p-6">
          {/* Form Section */}
          <div
            className={cn("flex-1 space-y-6", showPreview ? "lg:max-w-3xl" : "")}
        >
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>
                Enter the basic invoice information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        invoiceNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={e =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    placeholder="PO Number, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="client">Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={value =>
                    setFormData({ ...formData, clientId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Issue Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.issueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.issueDate ? (
                          format(ensureValidDate(formData.issueDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.issueDate}
                        onSelect={date =>
                          setFormData({ ...formData, issueDate: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? (
                          format(ensureValidDate(formData.dueDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={date =>
                          setFormData({ ...formData, dueDate: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add time entries or manual items</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 py-4">
                <InvoiceTable
                  clientCurrency={company?.baseCurrency || "USD"}
                  dateFormat={company?.dateFormat || "MM/dd/yyyy"}
                  selectedClient={selectedClient}
                  lineItems={lineItems}
                  setLineItems={setLineItems}
                  selectedLineItems={selectedLineItems}
                  setSelectedLineItems={setSelectedLineItems}
                  manualEntryArr={manualEntryArr}
                  setManualEntryArr={setManualEntryArr}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Tax, discount, and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        discount: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={formData.tax}
                    onChange={e =>
                      setFormData({ ...formData, tax: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes or payment instructions"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="flex-1 lg:max-w-2xl lg:sticky lg:top-24 lg:h-fit">
              <InvoicePreview invoice={previewInvoice} isEditing={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
