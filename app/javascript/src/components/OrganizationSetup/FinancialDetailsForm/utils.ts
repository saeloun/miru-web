import * as Yup from "yup";

import { currencyList } from "constants/currencyList";

export const financialDetailsFormValidationSchema = Yup.object().shape({
  base_currency: Yup.object().shape({
    value: Yup.string().required("Base currency end cannot be blank"),
  }),
  standard_rate: Yup.number().min(
    0,
    "Standard rate(per hour) must be greater than or equal to 0"
  ),
  year_end: Yup.object().shape({
    value: Yup.string().required("Fiscal year end cannot be blank"),
  }),

  date_format: Yup.object().shape({
    value: Yup.string().required("Date format cannot be blank"),
  }),
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
    label: "December",
    value: "Dec",
  },
  {
    label: "March",
    value: "Mar",
  },
  {
    label: "September",
    value: "Sep",
  },
];

export const dateFormatOptions = [
  {
    label: "MM-DD-YYYY",
    value: "MM-DD-YYYY",
  },
  {
    label: "DD-MM-YYYY",
    value: "DD-MM-YYYY",
  },
  {
    label: "YYYY-MM-DD",
    value: "YYYY-MM-DD",
  },
];

export const financialDetailsFormInitialValues = {
  base_currency: {
    label: `${currencyList[0].symbol} (${currencyList[0].code})`,
    value: currencyList[0].code,
  },
  standard_rate: "00.00",
  year_end: fiscalYearEndOptions[0],
  date_format: dateFormatOptions[0],
  working_days: "5",
  working_hours: "40",
};
