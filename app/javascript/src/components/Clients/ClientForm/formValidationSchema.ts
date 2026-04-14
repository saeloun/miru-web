import { currencyList } from "constants/currencyList";

import { i18n } from "../../../i18n";
import worldCountries from "world-countries";
import * as Yup from "yup";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

interface Currency {
  code: string;
  symbol: string;
}

const clientSchema = Yup.object().shape({
  name: Yup.string()
    .required(i18n.t("auth.validation.nameRequired"))
    .max(30, i18n.t("auth.validation.max30")),
  email: Yup.string().email(i18n.t("auth.validation.invalidEmail")),
  phone: Yup.string().matches(
    phoneRegExp,
    i18n.t("auth.validation.validBusinessPhone")
  ),
  address1: Yup.string()
    .required(i18n.t("auth.validation.addressLineRequired"))
    .max(50, i18n.t("auth.validation.max50")),
  address2: Yup.string().max(50, i18n.t("auth.validation.max50")),
  country: Yup.object().shape({
    value: Yup.string().required(i18n.t("auth.validation.countryRequired")),
  }),
  state: Yup.string()
    .required(i18n.t("auth.validation.stateRequired"))
    .max(50, i18n.t("auth.validation.max50")),
  city: Yup.string()
    .required(i18n.t("auth.validation.cityRequired"))
    .max(50, i18n.t("auth.validation.max50")),
  zipcode: Yup.string()
    .required(i18n.t("auth.validation.zipcodeLineRequired"))
    .max(10, i18n.t("auth.validation.max10")),
  currency: Yup.object().shape({
    value: Yup.string().required(i18n.t("auth.validation.currencyRequired")),
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

const getInitialvalues = (client?: any) => ({
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

export { clientSchema, getInitialvalues };
