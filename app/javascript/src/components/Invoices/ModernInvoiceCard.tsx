import React from "react";
import { MoreHorizontal, Send, Download, Eye, Edit, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { formatCurrency } from "../../utils/currencyFormatter";
import { formatDate, getHumanDate } from "../../utils/dateHelpers";
import { cn } from "../../lib/utils";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

export interface ModernInvoiceCardProps {
  invoice: Invoice;
  onView?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  onDuplicate?: (invoice: Invoice) => void;
  onStatusChange?: (invoice: Invoice, status: Invoice["status"]) => void;
  className?: string;
  compact?: boolean;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
    dotClassName: "bg-gray-500",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
    dotClassName: "bg-blue-500",
  },
  viewed: {
    label: "Viewed",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-100/80",
    dotClassName: "bg-purple-500",
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 hover:bg-green-100/80",
    dotClassName: "bg-green-500",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 hover:bg-red-100/80",
    dotClassName: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100/80",
    dotClassName: "bg-gray-400",
  },
};

export const ModernInvoiceCard: React.FC<ModernInvoiceCardProps> = ({
  invoice,
  onView,
  onEdit,
  onDelete,
  onSend,
  onDownload,
  onDuplicate,
  onStatusChange,
  className,
  compact = false,
}) => {
  const status = statusConfig[invoice.status];
  const isOverdue = invoice.status === "sent" && new Date(invoice.dueDate) < new Date();
  
  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
  };

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-4 border-b hover:bg-gray-50/50 transition-colors cursor-pointer",
          className
        )}
        onClick={() => onView?.(invoice)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">#{invoice.invoiceNumber}</span>
              <Badge variant="secondary" className={cn("text-xs", status.className)}>
                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status.dotClassName)} />
                {status.label}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{invoice.client.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold">{formatCurrency(invoice.amount, invoice.currency)}</div>
            <div className="text-xs text-muted-foreground">Due {getHumanDate(invoice.dueDate)}</div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleAction(() => {})}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={handleAction(() => onView(invoice))}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              {onEdit && invoice.status === "draft" && (
                <DropdownMenuItem onClick={handleAction(() => onEdit(invoice))}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onSend && invoice.status === "draft" && (
                <DropdownMenuItem onClick={handleAction(() => onSend(invoice))}>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={handleAction(() => onDownload(invoice))}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={handleAction(() => onDuplicate(invoice))}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleAction(() => onDelete(invoice))}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 cursor-pointer",
        isOverdue && "border-red-200",
        className
      )}
      onClick={() => onView?.(invoice)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">#{invoice.invoiceNumber}</h3>
              <Badge variant="secondary" className={status.className}>
                <span className={cn("w-2 h-2 rounded-full mr-2", status.dotClassName)} />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleAction(() => {})}>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onView && (
                <DropdownMenuItem onClick={handleAction(() => onView(invoice))}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Invoice
                </DropdownMenuItem>
              )}
              {onEdit && invoice.status === "draft" && (
                <DropdownMenuItem onClick={handleAction(() => onEdit(invoice))}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </DropdownMenuItem>
              )}
              {onSend && invoice.status === "draft" && (
                <DropdownMenuItem onClick={handleAction(() => onSend(invoice))}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={handleAction(() => onDownload(invoice))}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={handleAction(() => onDuplicate(invoice))}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              
              {onStatusChange && (
                <>
                  <DropdownMenuSeparator />
                  {invoice.status === "sent" && (
                    <DropdownMenuItem 
                      onClick={handleAction(() => onStatusChange(invoice, "paid"))}
                      className="text-green-600"
                    >
                      Mark as Paid
                    </DropdownMenuItem>
                  )}
                  {invoice.status === "draft" && (
                    <DropdownMenuItem 
                      onClick={handleAction(() => onStatusChange(invoice, "sent"))}
                      className="text-blue-600"
                    >
                      Mark as Sent
                    </DropdownMenuItem>
                  )}
                  {(invoice.status === "sent" || invoice.status === "overdue") && (
                    <DropdownMenuItem 
                      onClick={handleAction(() => onStatusChange(invoice, "cancelled"))}
                      className="text-gray-600"
                    >
                      Cancel Invoice
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleAction(() => onDelete(invoice))}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Invoice
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {invoice.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {invoice.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
          </div>
          
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">
              {formatDate(invoice.dueDate, "DD MMM YYYY")}
            </p>
            {isOverdue && (
              <p className="text-xs text-red-600 font-medium">
                Overdue by {Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </div>
        </div>
        
        {invoice.status === "draft" && onSend && (
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              size="sm"
              onClick={handleAction(() => onSend(invoice))}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAction(() => onEdit(invoice))}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
        
        {invoice.status === "paid" && invoice.paidDate && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-400">
              Paid on {formatDate(invoice.paidDate, "DD MMM YYYY")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};