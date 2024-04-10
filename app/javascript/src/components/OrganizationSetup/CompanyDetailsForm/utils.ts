import * as Yup from "yup";

import { CountryList } from "constants/countryList";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

export const companyDetailsFormValidationSchema = Yup.object().shape({
  company_name: Yup.string()
    .required("Company name cannot be blank")
    .max(30, "Maximum 30 characters are allowed"),
  business_phone: Yup.string().matches(
    phoneRegExp,
    "Please enter a valid business phone number"
  ),
  address_line_1: Yup.string()
    .required("Address line cannot be blank")
    .max(50, "Maximum 50 characters are allowed"),
  address_line_2: Yup.string().max(50, "Maximum 50 characters are allowed"),
  country: Yup.object().shape({
    value: Yup.string().required("Country cannot be blank"),
  }),
  state: Yup.object().shape({
    value: Yup.string().required("State cannot be blank"),
  }),
  city: Yup.object().shape({
    value: Yup.string().required("City cannot be blank"),
  }),
  zipcode: Yup.string()
    .required("Zipcode line cannot be blank")
    .max(10, "Maximum 10 characters are allowed"),
});

export const mostSelectedCountries = [
  {
    label: "United States",
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
    label: "Most selected countries",
    options: mostSelectedCountries,
  },
  {
    label: "Please select",
    options: countryListOptions,
  },
];

export const companyDetailsFormInitialValues = {
  company_name: "",
  business_phone: "",
  address_line_1: "",
  address_line_2: "",
  logo_url: null,
  logo: null,
  country: mostSelectedCountries[0], //{ value: null, label: null, code: null },
  state: { value: "", label: "" },
  city: { value: "", label: "" },
  zipcode: "",
  timezone: {
    label: "(GMT-05:00) Eastern Time (US & Canada)",
    value: "(GMT-05:00) Eastern Time (US & Canada)",
  },
};
