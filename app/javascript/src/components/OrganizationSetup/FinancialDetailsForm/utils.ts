import * as Yup from "yup";

import { currencyList } from "constants/currencyList";

export const financialDetailsFormInitialValues = {
  base_currency: currencyList[0].code,
  standard_rate: 0.0,
  year_end: "MAR",
  date_format: "DD-MM-YYYY",
};

export const financialDetailsFormValidationSchema = Yup.object().shape({
  base_currency: Yup.string().required("Company name can not be blank"),
  standard_rate: Yup.string().required(
    "Business phone number can not be blank"
  ),
  year_end: Yup.string().required("Address line1 can not be blank"),
  date_format: Yup.string().required("Country can not be blank"),
});

export const currencyListOptions = currencyList.map(currency => {
  const label = `${currency.symbol} (${currency.code})`;

  return {
    label,
    value: currency.code,
  };
});

export const fiscalYearEndOptions = [
  {
    label: "March",
    value: "Mar",
  },
  {
    label: "September",
    value: "Sep",
  },
  {
    label: "December",
    value: "Dec",
  },
];

export const dateFormatOptions = [
  {
    label: "DD-MM-YYYY",
    value: "DD-MM-YYYY",
  },
  {
    label: "MM-DD-YYYY",
    value: "MM-DD-YYYY",
  },
  {
    label: "YYYY-MM-DD",
    value: "YYYY-MM-DD",
  },
];
