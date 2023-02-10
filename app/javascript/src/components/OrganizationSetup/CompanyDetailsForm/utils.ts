import * as Yup from "yup";

import { CountryList } from "constants/countryList";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

export const companyDetailsFormValidationSchema = Yup.object().shape({
  company_name: Yup.string().required("Company name can not be blank"),
  business_phone: Yup.string()
    .required("Business phone number can not be blank")
    .matches(phoneRegExp, "Please enter a valid business phone number"),
  address: Yup.string().required("Address line can not be blank"),
  country: Yup.object().shape({
    value: Yup.string().required("Country can not be blank"),
  }),
});

export const mostSelectedCountries = [
  {
    label: "United States",
    value: "US",
  },
  {
    label: "India",
    value: "IN",
  },
  {
    label: "Canada",
    value: "CA",
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
  address: "",
  logo_url: null,
  // address_line2: "",
  logo: null,
  country: mostSelectedCountries[0],
  timezone: {
    label: "(GMT-05:00) Eastern Time (US & Canada)",
    value: "(GMT-05:00) Eastern Time (US & Canada)",
  },
};
