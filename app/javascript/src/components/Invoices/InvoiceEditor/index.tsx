import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Calendar,
  Plus,
  Trash,
  FloppyDisk,
  PaperPlaneTilt,
  Eye,
  EyeSlash,
} from "phosphor-react";
import InvoicePreview from "../InvoicePreview";

interface InvoiceEditorProps {
  invoice?: any;
  clients: any[];
  company: any;
  onSave: (invoice: any) => void;
  onCancel: () => void;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  clients,
  company,
  onSave,
  onCancel,
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now()}`,
    status: invoice?.status || "draft",
    clientId: invoice?.clientId || "",
    issueDate: invoice?.issueDate || new Date(),
    dueDate:
      invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    reference: invoice?.reference || "",
    notes: invoice?.notes || "",
    lineItems: invoice?.lineItems || [
      { id: "1", description: "", quantity: 1, rate: 0, amount: 0 },
    ],
    discount: invoice?.discount || 0,
    tax: invoice?.tax || 0,
  });

  const selectedClient = useMemo(
    () =>
      clients.find(c => c.id === formData.clientId) || {
        name: "Select a client",
        email: "",
        address: "",
      },
    [formData.clientId, clients]
  );

  const subtotal = useMemo(
    () => formData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0),
    [formData.lineItems]
  );

  const total = useMemo(
    () => subtotal - formData.discount + formData.tax,
    [subtotal, formData.discount, formData.tax]
  );

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index][field] = value;

    // Calculate amount if quantity or rate changes
    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount =
        updatedItems[index].quantity * updatedItems[index].rate;
    }

    setFormData({ ...formData, lineItems: updatedItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        {
          id: Date.now().toString(),
          description: "",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      const updatedItems = formData.lineItems.filter((_, i) => i !== index);
      setFormData({ ...formData, lineItems: updatedItems });
    }
  };

  const previewInvoice = {
    ...formData,
    amount: total,
    subtotal,
    currency: company.baseCurrency,
    client: selectedClient,
    company,
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {invoice ? "Edit Invoice" : "Create Invoice"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the details and preview your invoice in real-time
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="md:hidden"
              >
                {showPreview ? (
                  <EyeSlash className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={() => onSave(formData)} variant="outline">
                <FloppyDisk className="mr-2 h-4 w-4" />
                FloppyDisk Draft
              </Button>
              <Button
                onClick={() => onSave({ ...formData, status: "sent" })}
                className="bg-[#5B34EA] hover:bg-[#4926D1]"
              >
                <PaperPlaneTilt className="mr-2 h-4 w-4" />
                PaperPlaneTilt Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Form Section */}
        <div
          className={cn("flex-1 space-y-6", showPreview ? "lg:max-w-2xl" : "")}
        >
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
              <CardDescription>
                Enter the basic invoice information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.issueDate ? (
                          format(formData.issueDate, "PPP")
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
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.dueDate ? (
                          format(formData.dueDate, "PPP")
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
              <CardDescription>Add the products or services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={e =>
                          handleLineItemChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Service or product description"
                      />
                    </div>
                    <div className="w-20">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e =>
                          handleLineItemChange(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="w-28">
                      <Label>Rate</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={e =>
                          handleLineItemChange(
                            index,
                            "rate",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="w-28">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={formData.lineItems.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addLineItem} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Tax, discount, and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
          <div className="flex-1 lg:sticky lg:top-24 lg:h-fit">
            <InvoicePreview invoice={previewInvoice} isEditing={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceEditor;
