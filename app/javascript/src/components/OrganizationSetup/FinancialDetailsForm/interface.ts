import { FinancialDetails } from "../interface";

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
}

export interface FinancialDetailsFormProps {
  onSaveBtnClick: (financialDetails: FinancialDetails) => void; // eslint-disable-line
}
