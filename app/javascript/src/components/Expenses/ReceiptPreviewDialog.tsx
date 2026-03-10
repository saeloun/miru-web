import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

import ReceiptPreview from "./ReceiptPreview";

interface ReceiptExpense {
  description: string;
  receipts?: string[];
}

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ReceiptExpense | null;
}

const ReceiptPreviewDialog: React.FC<ReceiptPreviewDialogProps> = ({
  open,
  onOpenChange,
  expense,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Receipt preview</DialogTitle>
        <DialogDescription>
          {expense?.description || "Review uploaded receipts for this expense."}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[75vh] pr-4">
        <ReceiptPreview receipts={expense?.receipts || []} />
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export default ReceiptPreviewDialog;
