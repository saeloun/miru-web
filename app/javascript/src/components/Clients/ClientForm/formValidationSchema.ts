/* eslint-disable import/exports-last */
import { currencyList } from "constants/currencyList";

import worldCountries from "world-countries";
import * as Yup from "yup";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

interface Currency {
  code: string;
  symbol: string;
}

export const clientSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name cannot be blank")
    .max(30, "Maximum 30 characters are allowed"),
  phone: Yup.string().matches(
    phoneRegExp,
    "Please enter a valid business phone number"
  ),
  address1: Yup.string()
    .required("Address line cannot be blank")
    .max(50, "Maximum 50 characters are allowed"),
  address2: Yup.string().max(50, "Maximum 50 characters are allowed"),
  country: Yup.object().shape({
    value: Yup.string().required("Country cannot be blank"),
  }),
  state: Yup.string()
    .required("State cannot be blank")
    .max(50, "Maximum 50 characters are allowed"),
  city: Yup.string()
    .required("City cannot be blank")
    .max(50, "Maximum 50 characters are allowed"),
  zipcode: Yup.string()
    .required("Zipcode line cannot be blank")
    .max(10, "Maximum 10 characters are allowed"),
  currency: Yup.object().shape({
    value: Yup.string().required("Currency cannot be blank"),
  }),
});

const getCountryLabel = countryCode => {
  if (countryCode) {
    const countryObj = worldCountries.find(
      country => country["cca2"] === countryCode
    );

    return countryObj.name.common;
  }

  return "";
};

const getCurrencyLabel = (currency?: string): string => {
  if (currency) {
    const currencyObj: Currency | undefined = currencyList.find(
      (cur: Currency) => cur.code === currency
    );

    return `${currencyObj.symbol} (${currencyObj.code})`;
  }

  return "";
};

export const getInitialvalues = (client?: any) => ({
  name: client?.name || "",
  email: client?.email || "",
  phone: client?.phone || "",
  address1: client?.address?.address_line_1 || "",
  address2: client?.address?.address_line_2 || "",
  country: {
    label: getCountryLabel(client?.address?.country),
    code: client?.address?.country || "",
    value: client?.address?.country || "",
  },
  state: client?.address?.state || "",
  city: client?.address?.city || "",
  zipcode: client?.address?.pin || "",
  minutes: client?.minutes || "",
  logo: client?.logo || null,
  currency: {
    label: getCurrencyLabel(client?.currency),
    value: client?.currency || "",
  },
});
