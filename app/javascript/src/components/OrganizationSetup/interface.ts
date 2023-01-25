export interface CompanyDetails {
  company_name: string;
  business_phone: string;
  address: string;
  country: string;
  timezone: string;
  logo_url?: string | null;
  logo?: any | null;
}

export interface FinancialDetails {
  base_currency: string;
  standard_rate: number | string;
  year_end: string;
  date_format: string;
}
