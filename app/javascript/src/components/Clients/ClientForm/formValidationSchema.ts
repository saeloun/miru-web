/* eslint-disable import/exports-last */
import { Country } from "country-state-city";
import * as Yup from "yup";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

export const clientSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name cannot be blank")
    .max(30, "Maximum 30 characters are allowed"),
  phone: Yup.string()
    .required("Business phone number cannot be blank")
    .matches(phoneRegExp, "Please enter a valid business phone number"),
  address1: Yup.string()
    .required("Address line cannot be blank")
    .max(50, "Maximum 50 characters are allowed"),
  address2: Yup.string().max(50, "Maximum 50 characters are allowed"),
  country: Yup.object().shape({
    value: Yup.string().required("Country cannot be blank"),
  }),
});

const getCountryLabel = countryCode => {
  if (countryCode) {
    const countryObj = Country.getCountryByCode(countryCode);

    return countryObj.name;
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
  state: {
    label: client?.address?.state || "",
    code: client?.address?.state || "",
    value: client?.address?.state || "",
  },
  city: {
    label: client?.address?.city || "",
    code: client?.address?.city || "",
    value: client?.address?.city || "",
  },
  zipcode: client?.address?.pin || "",
  minutes: client?.minutes || "",
  logo: client?.logo || null,
});
