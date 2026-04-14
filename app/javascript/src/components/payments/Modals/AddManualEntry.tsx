import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { i18n } from "../../../i18n";

import PaymentEntryForm from "./PaymentEntryForm";

const AddManualEntry = ({
  setShowManualEntryModal,
  invoiceList,
  dateFormat,
  fetchPaymentList,
  fetchInvoiceList,
  baseCurrency,
  showManualEntryModal,
}) => (
  <Dialog open={showManualEntryModal} onOpenChange={setShowManualEntryModal}>
    <DialogContent className="max-w-lg overflow-visible">
      <DialogHeader>
        <DialogTitle>{i18n.t("payments.addPayment")}</DialogTitle>
        <DialogDescription>
          {i18n.t("payments.recordManualPaymentAgainstInvoice")}
        </DialogDescription>
      </DialogHeader>
      <PaymentEntryForm
        baseCurrency={baseCurrency}
        dateFormat={dateFormat}
        fetchInvoiceList={fetchInvoiceList}
        fetchPaymentList={fetchPaymentList}
        invoiceList={invoiceList}
        setShowManualEntryModal={setShowManualEntryModal}
      />
    </DialogContent>
  </Dialog>
);

export default AddManualEntry;
