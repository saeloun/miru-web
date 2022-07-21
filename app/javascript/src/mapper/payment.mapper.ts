import { InvoiceList } from "./interface";

const getInvoiceList = (invoiceList: Array<InvoiceList>) =>
  invoiceList.map((invoice) => ({
    value: invoice.id,
    label: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    amount: invoice.amount,
    status: invoice.status
  }));

const unmapPayment = (input) => {
  const invoiceList = getInvoiceList(input.invoices);
  return {
    invoiceList
  };
};

const mapPayment = (input) => ({
  invoice_id: input.invoice.value,
  transaction_date: input.transactionDate,
  transaction_type: input.transactionType,
  amount: input.amount,
  note: input.note
});

export { unmapPayment, mapPayment };
