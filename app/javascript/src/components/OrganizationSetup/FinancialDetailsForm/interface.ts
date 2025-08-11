export interface FinancialDetailsFormValues {
  base_currency: {
    label: string;
    value: string;
  };
  standard_rate: number | string;
  year_end: {
    label: string;
    value: string;
  };
  date_format: {
    label: string;
    value: string;
  };
  working_hours: string;
  working_days: string;
}

export interface FinancialDetailsFormProps {
  onSaveBtnClick: (financialDetails: FinancialDetailsFormValues) => void;
  setFinancialDetails: (values: any) => void;
  isUpdatedFormValues: boolean;
  prevFormValues: FinancialDetailsFormValues;
}
