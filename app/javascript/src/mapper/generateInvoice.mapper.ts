import dayjs from "dayjs";

interface GenerateInvoiceClientList {
  address: string;
  id: number;
  name: string;
  phone_number: number;
  email: string;
  previousInvoiceNumber: string;
  client_members: any;
}

interface CompanyDetails {
  address: string;
  country: string;
  id: number;
  logo: string;
  name: string;
  phone_number: string;
}

const getClientList = (clientList: Array<GenerateInvoiceClientList>) =>
  clientList.map(client => ({
    address: client.address,
    id: client.id,
    name: client.name,
    phone: client.phone_number,
    previousInvoiceNumber: client.previousInvoiceNumber,
    clientMembersEmails: client.client_members,
  }));

const getCompanyDetails = (input: CompanyDetails) => input;

const unmapGenerateInvoice = input => {
  const companyDetails = getCompanyDetails(input.company_details);
  const clientList = getClientList(input.company_client_list);

  return {
    companyDetails,
    clientList,
  };
};

const mapGenerateInvoice = input => ({
  client_id: input.selectedClient.id,
  invoice_number: input.invoiceNumber,
  reference: input.reference,
  issue_date:
    input.dateFormat == "DD-MM-YYYY"
      ? input.issueDate
      : dayjs(input.issueDate).format("DD.MM.YYYY"),
  due_date:
    input.dateFormat == "DD-MM-YYYY"
      ? input.dueDate
      : dayjs(input.dueDate).format("DD.MM.YYYY"),
  amount_due: input.amountDue,
  amount_paid: input.amountPaid,
  amount: input.amount,
  discount: input.discount,
  tax: input.tax,
  stripe_enabled: input.isStripeEnabled,
  invoice_line_items_attributes: input.invoiceLineItems.map(ilt => ({
    name: ilt.name,
    description: ilt.description,
    date:
      input.dateFormat == "DD-MM-YYYY"
        ? ilt.date
        : dayjs(ilt.date).format("DD-MM-YYYY"),
    rate: ilt.rate,
    quantity: ilt.quantity,
    timesheet_entry_id: ilt.timesheet_entry_id,
    _destroy: ilt._destroy,
  })),
});

export { unmapGenerateInvoice, mapGenerateInvoice };
