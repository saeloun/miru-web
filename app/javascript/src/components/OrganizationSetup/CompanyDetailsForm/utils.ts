import { CountryList } from "constants/countryList";
import {
  getStoredBrowserCountry,
  getStoredBrowserTimeZone,
  i18n,
} from "../../../i18n";

import * as Yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";

const zipcodeRegExp = /^(?=.*[A-Za-z0-9])[A-Za-z0-9\s-]{1,10}$/;

export const companyDetailsFormValidationSchema = Yup.object().shape({
  company_name: Yup.string()
    .required(i18n.t("auth.validation.nameRequired"))
    .max(30, i18n.t("auth.validation.max30")),
  business_phone: Yup.string()
    .test(
      "is-valid-phone",
      i18n.t("auth.validation.validBusinessPhone"),
      value => !value || isValidPhoneNumber(value)
    )
    .max(15, i18n.t("auth.validation.max15")),
  address_line_1: Yup.string()
    .required(i18n.t("auth.validation.addressLineRequired"))
    .max(50, i18n.t("auth.validation.max50")),
  address_line_2: Yup.string().max(50, i18n.t("auth.validation.max50")),
  country: Yup.object().shape({
    value: Yup.string().required(i18n.t("auth.validation.countryRequired")),
  }),
  state: Yup.string().required(i18n.t("auth.validation.stateRequired")),
  city: Yup.string().required(i18n.t("auth.validation.cityRequired")),
  zipcode: Yup.string()
    .required(i18n.t("auth.validation.zipcodeLineRequired"))
    .matches(zipcodeRegExp, i18n.t("auth.validation.invalidZipcode"))
    .max(10, i18n.t("auth.validation.max10")),
});

export const mostSelectedCountries = [
  {
    label: i18n.t("countries.unitedStates"),
    value: "US",
    code: "US",
  },
  {
    label: "India",
    value: "IN",
    code: "IN",
  },
  {
    label: "Canada",
    value: "CA",
    code: "CA",
  },
];

export const countryListOptions = CountryList?.filter(country => {
  const mostSelectedCountryCodes = ["US", "IN", "CA"];

  return !mostSelectedCountryCodes.includes(country.code);
}).map(country => ({ value: country.code, label: country.name }));

export const groupedCountryListOptions = [
  {
    label: i18n.t("orgSetup.mostSelectedCountries"),
    options: mostSelectedCountries,
  },
  {
    label: i18n.t("orgSetup.selectCountryGroup"),
    options: countryListOptions,
  },
];

const browserCountry = getStoredBrowserCountry();
const defaultCountry = mostSelectedCountries.find(
  country => country.code === browserCountry
) || {
  label:
    CountryList.find(country => country.code === browserCountry)?.name ||
    mostSelectedCountries[0].label,
  value: browserCountry,
  code: browserCountry,
};

export const companyDetailsFormInitialValues = {
  company_name: "",
  business_phone: "",
  address_line_1: "",
  address_line_2: "",
  logo_url: null,
  logo: null,
  country: defaultCountry,
  state: "",
  city: "",
  zipcode: "",
  timezone: {
    label: getStoredBrowserTimeZone(),
    value: getStoredBrowserTimeZone(),
  },
};
