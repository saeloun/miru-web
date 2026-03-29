import dayjs from "dayjs";

interface GenerateInvoiceClientList {
  address: any;
  id: number;
  name: string;
  phone: string;
  email: string;
  currency: string;
  previousInvoiceNumber: string;
  client_members?: any;
  clientMembers?: any;
}

interface CompanyDetails {
  address: any;
  country: string;
  id: number;
  logo: string;
  name: string;
  business_phone?: string;
  businessPhone?: string;
  currency: string;
  standard_price?: string;
  standardPrice?: number;
  fiscal_year_end?: string;
  fiscalYearEnd?: string;
  timezone: string;
  date_format?: string;
  dateFormat?: string;
  calendar_enabled?: boolean;
  calendarEnabled?: boolean;
  logo_url?: string;
  logoUrl?: string;
  working_days?: any;
  workingDays?: any;
  working_hours?: any;
  workingHours?: any;
}

const getClientList = (clientList: Array<GenerateInvoiceClientList>) =>
  clientList.map(client => ({
    address: client.address,
    id: client.id,
    value: client.id, // Some components expect a 'value' property for dropdowns
    name: client.name,
    label: client.name, // Some components expect a 'label' property for dropdowns
    phone: client.phone,
    clientCurrency: client.currency,
    previousInvoiceNumber: client.previousInvoiceNumber,
    clientMembersEmails: client.client_members || client.clientMembers,
  }));

const getCompanyDetails = (input: CompanyDetails) => ({
  ...input,
  // Normalize to camelCase for consistent usage in components
  businessPhone: input.business_phone || input.businessPhone,
  standardPrice: input.standard_price || input.standardPrice,
  fiscalYearEnd: input.fiscal_year_end || input.fiscalYearEnd,
  dateFormat: input.date_format || input.dateFormat,
  calendarEnabled: input.calendar_enabled || input.calendarEnabled,
  logoUrl: input.logo_url || input.logoUrl,
  workingDays: input.working_days || input.workingDays,
  workingHours: input.working_hours || input.workingHours,
});

const unmapGenerateInvoice = input => {
  // Handle both snake_case (from API) and camelCase
  const companyDetails = getCompanyDetails(
    input.company_details || input.companyDetails
  );

  const clientList = getClientList(
    input.company_client_list || input.companyClientList
  );

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
  currency: input.selectedClient.clientCurrency,
  base_currency_amount: input.baseCurrencyAmount,
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
