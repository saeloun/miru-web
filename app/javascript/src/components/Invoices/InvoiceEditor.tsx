import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import {
  Plus,
  Trash,
  FloppyDisk,
  PaperPlaneTilt,
  Eye,
  User,
  Buildings,
} from "phosphor-react";
import { cn } from "../../lib/utils";
import { currencyFormat } from "../../helpers/currency";

import {
  InvoiceItem,
  Client,
  InvoiceFormData,
} from "../../services/invoiceApi";

interface InvoiceEditorProps {
  invoice?: InvoiceFormData;
  clients: Client[];
  onSave?: (invoice: InvoiceFormData) => void;
  onSend?: (invoice: InvoiceFormData) => void;
  onPreview?: (invoice: InvoiceFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  clients,
  onSave,
  onSend,
  onPreview,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>(
    invoice || {
      invoiceNumber: `INV-${Date.now()}`,
      clientId: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      invoiceLineItems: [
        { id: "new", description: "", quantity: 1, rate: 0, amount: 0 },
      ],
      reference: "",
      tax: 0,
      discount: 0,
      currency: "USD",
      status: "draft",
    }
  );

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };

    setFormData(prev => ({
      ...prev,
      invoiceLineItems: [...prev.invoiceLineItems, newItem],
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.invoiceLineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate amount
    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount =
        updatedItems[index].quantity * updatedItems[index].rate;
    }

    setFormData(prev => ({ ...prev, invoiceLineItems: updatedItems }));
  };

  const removeItem = (index: number) => {
    if (formData.invoiceLineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        invoiceLineItems: prev.invoiceLineItems.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateSubtotal = () =>
    formData.invoiceLineItems.reduce((sum, item) => sum + item.amount, 0);

  const calculateTaxAmount = () =>
    calculateSubtotal() * ((formData.tax || 0) / 100);

  const calculateDiscountAmount = () =>
    calculateSubtotal() * ((formData.discount || 0) / 100);

  const calculateTotal = () =>
    calculateSubtotal() + calculateTaxAmount() - calculateDiscountAmount();


  const selectedClient = clients.find(c => c.id === formData.clientId);

  const isFormValid = () =>
    formData.clientId &&
    formData.invoiceLineItems.length > 0 &&
    formData.invoiceLineItems.every(
      item => item.description && item.quantity > 0 && item.rate >= 0
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {invoice ? "Edit Invoice" : "Create Invoice"}
          </h1>
          <p className="text-muted-foreground">
            {invoice
              ? `Invoice #${invoice.invoiceNumber}`
              : "Create a new invoice for your client"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => onPreview?.(formData)}
            disabled={!isFormValid()}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => onSave?.(formData)}
            disabled={!isFormValid() || isLoading}
          >
            <FloppyDisk className="h-4 w-4 mr-2" />
            FloppyDisk Draft
          </Button>
          <Button
            onClick={() => onSend?.(formData)}
            disabled={!isFormValid() || isLoading}
          >
            <PaperPlaneTilt className="h-4 w-4 mr-2" />
            PaperPlaneTilt Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Buildings className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={e =>
                      updateFormData("invoiceNumber", e.target.value)
                    }
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={e => updateFormData("issueDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={e => updateFormData("dueDate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Bill To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Select Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={value => updateFormData("clientId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client" />
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
                {selectedClient && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{selectedClient.name}</div>
                      <div className="text-muted-foreground">
                        {selectedClient.email}
                      </div>
                      <div className="text-muted-foreground whitespace-pre-line">
                        {selectedClient.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.invoiceLineItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 items-end"
                >
                  <div className="col-span-5">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={e =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Describe your service or product"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={e =>
                        updateItem(
                          index,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`rate-${index}`}>Rate</Label>
                    <Input
                      id={`rate-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={e =>
                        updateItem(
                          index,
                          "rate",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Amount</Label>
                    <div className="text-sm font-medium py-2 px-3 bg-muted rounded-md">
                      {currencyFormat(formData.currency, item.amount)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={formData.invoiceLineItems.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference || ""}
                  onChange={e => updateFormData("reference", e.target.value)}
                  placeholder="Add a reference or PO number"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{currencyFormat(formData.currency, calculateSubtotal())}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.tax || 0}
                        onChange={e =>
                          updateFormData("tax", parseFloat(e.target.value) || 0)
                        }
                        className="w-16 h-6 text-xs"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span></span>
                    <span>{currencyFormat(formData.currency, calculateTaxAmount())}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discount || 0}
                        onChange={e =>
                          updateFormData(
                            "discount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 h-6 text-xs"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span></span>
                    <span>-{currencyFormat(formData.currency, calculateDiscountAmount())}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{currencyFormat(formData.currency, calculateTotal())}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="currency" className="text-sm">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={value => updateFormData("currency", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status && (
                <div className="pt-4 border-t">
                  <Label className="text-sm">Status</Label>
                  <div className="mt-2">
                    <Badge
                      className={cn(
                        formData.status === "paid" &&
                          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
                        formData.status === "sent" &&
                          "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
                        formData.status === "overdue" &&
                          "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
                        formData.status === "draft" &&
                          "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                      )}
                    >
                      {formData.status.charAt(0).toUpperCase() +
                        formData.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
