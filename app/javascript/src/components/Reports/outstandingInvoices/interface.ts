export interface OutstandingOverdueInvoice {
  id: number;
  clientName: string,
  dueDate: string,
  amount: string,
  invoiceNo: string,
  issueDate: string,
  status: string,
}

export interface ClientList {
  name: string,
  totalOutstandingAmount: number,
  totalOverdueAmount: number,
  invoices: OutstandingOverdueInvoice[];
}
