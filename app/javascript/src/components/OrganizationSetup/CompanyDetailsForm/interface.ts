export interface CompanyDetailsFormValues {
  company_name: string;
  business_phone: string;
  address: string;
  country: {
    label: string;
    value: string;
  };
  timezone: {
    label: string;
    value: string;
  };
  logo_url?: string | null;
  logo?: any | null;
}

export interface CompanyDetailsFormProps {
  onNextBtnClick: (companyDetails: CompanyDetailsFormValues) => void; // eslint-disable-line
  isFormAlreadySubmitted: boolean;
  previousSubmittedValues?: CompanyDetailsFormValues;
}
