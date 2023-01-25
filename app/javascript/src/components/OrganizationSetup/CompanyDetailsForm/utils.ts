import * as Yup from "yup";

import { CountryList } from "constants/countryList";

export const companyDetailsFormInitialValues = {
  company: "",
  business_phone: "",
  address: "",
  logo_url: null,
  // address_line2: "",
  country: "US",
  timezone: "",
};

export const companyDetailsFormValidationSchema = Yup.object().shape({
  company: Yup.string().required("Company name can not be blank"),
  business_phone: Yup.string().required(
    "Business phone number can not be blank"
  ),
  address: Yup.string().required("Address line1 can not be blank"),
  country: Yup.string().required("Country can not be blank"),
  timezone: Yup.string().required("Timezone can not be blank"),
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
