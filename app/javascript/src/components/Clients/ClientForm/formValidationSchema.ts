import { currencyList } from "constants/currencyList";

import { i18n } from "../../../i18n";
import {
  hasMaximumPhoneDigits,
  hasMinimumPhoneDigits,
  isValidOptionalPhoneNumber,
} from "utils/phoneValidation";
import worldCountries from "world-countries";
import * as Yup from "yup";

interface Currency {
  code: string;
  symbol: string;
}

const clientSchema = Yup.object().shape({
  name: Yup.string()
    .required(i18n.t("auth.validation.nameRequired"))
    .max(30, i18n.t("auth.validation.max30")),
  email: Yup.string().email(i18n.t("auth.validation.invalidEmail")),
  ein: Yup.string().max(30, i18n.t("auth.validation.max30")),
  phone: Yup.string()
    .test(
      "phone-number-min-length",
      i18n.t("auth.validation.phoneMin2Digits"),
      hasMinimumPhoneDigits
    )
    .test(
      "phone-number-length",
      i18n.t("auth.validation.phoneMax15Digits"),
      hasMaximumPhoneDigits
    )
    .test(
      "is-valid-phone",
      i18n.t("auth.validation.validBusinessPhone"),
      isValidOptionalPhoneNumber
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
  ein: client?.ein || "",
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
