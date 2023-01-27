import * as Yup from "yup";

import { CountryList } from "constants/countryList";

export const companyDetailsFormValidationSchema = Yup.object().shape({
  company_name: Yup.string().required("Company name can not be blank"),
  business_phone: Yup.string().required(
    "Business phone number can not be blank"
  ),
  address: Yup.string().required("Address line can not be blank"),
  country: Yup.object().shape({
    value: Yup.string().required("Country can not be blank"),
  }),
  timezone: Yup.object().shape({
    value: Yup.string().required("Timezone can not be blank"),
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
    label: "(GMT-10:00) America/Adak",
    value: "(GMT-10:00) America/Adak",
  },
};
