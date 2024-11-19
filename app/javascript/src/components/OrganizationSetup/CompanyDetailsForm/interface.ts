export interface CompanyDetailsFormValues {
  company_name: string;
  business_phone: string;
  address_line_1: string;
  address_line_2: string;
  country: {
    label: string;
    value: string;
  };
  state: string;
  city: string;
  timezone: {
    label: string;
    value: string;
  };
  zipcode: string;
  logo_url?: string | null;
  logo?: any | null;
}

export interface CompanyDetailsFormProps {
  onNextBtnClick: (companyDetails: CompanyDetailsFormValues) => void; // eslint-disable-line
  isFormAlreadySubmitted: boolean;
  previousSubmittedValues?: CompanyDetailsFormValues;
  formType: string;
  isDesktop: boolean;
}
