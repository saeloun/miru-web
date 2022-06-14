import dayjs from "dayjs";

interface GenerateInvoiceClientList {
  address: string;
  id: number;
  name: string;
  phone_number: number;
  email: string
}

interface CompanyDetails {
  address: string;
  country: string;
  id: number;
  logo: string;
  name: string;
  phone_number: string;
}

const getClientList = (clientList: Array<GenerateInvoiceClientList>) => clientList.map(client => ({
  address: client.address,
  value: client.id,
  label: client.name,
  phone: client.phone_number,
  email: client.email
}));

const getCompanyDetails = (input: CompanyDetails) => input;

const unmapGenerateInvoice = (input) => {
  const companyDetails = getCompanyDetails(input.company_details);
  const clientList = getClientList(input.company_client_list);
  return {
    companyDetails,
    clientList
  };
};

const mapGenerateInvoice = (input) => ({
  client_id: input.selectedClient.value,
  invoice_number: input.invoiceNumber,
  reference: input.reference,
  issue_date: dayjs(input.issueDate).format("DD.MM.YYYY"),
  due_date: dayjs(input.dueDate).format("DD.MM.YYYY"),
  amount_due: input.amountDue,
  amount_paid: input.amountPaid,
  amount: input.amount,
  discount: input.discount,
  tax: input.tax,
  invoice_line_items_attributes: input.invoiceLineItems.map(ilt => ({
    name: ilt.name,
    description: ilt.description,
    date: ilt.date,
    rate: ilt.rate,
    quantity: ilt.qty,
    timesheet_entry_id: ilt.timesheet_entry_id
  }))
});

export {
  unmapGenerateInvoice,
  mapGenerateInvoice
};
