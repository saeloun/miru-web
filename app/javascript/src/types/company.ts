export interface CompanyAddress {
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  pin?: string;
}

export interface Company {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  phone_number?: string;
  businessPhone?: string;
  business_phone?: string;
  address?: string | CompanyAddress;
  logo?: string;
  currency?: string;
  baseCurrency?: string;
  base_currency?: string;
  dateFormat?: string;
  date_format?: string;
  timezone?: string;
  taxId?: string;
  tax_id?: string;
  vatNumber?: string;
  vat_number?: string;
  gstNumber?: string;
  gst_number?: string;
  ein?: string;
  usTaxpayerId?: string;
  us_taxpayer_id?: string;
  bankName?: string;
  bank_name?: string;
  bankAccountNumber?: string;
  bank_account_number?: string;
  bankRoutingNumber?: string;
  bank_routing_number?: string;
  bankSwiftCode?: string;
  bank_swift_code?: string;
  timesheet_edit_days?: number;
  team_member_limit?: number | string;
  team_member_limit_reached?: boolean;
  pro_access?: boolean;
  working_hours?: number | string;
  working_days?: number | string;
}
