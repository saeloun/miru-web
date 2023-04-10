/* eslint-disable import/exports-last */
import { Country } from "country-state-city";
import * as Yup from "yup";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

export const clientSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  phone: Yup.string()
    .required("Business phone number can not be blank")
    .matches(phoneRegExp, "Please enter a valid business phone number"),
  address1: Yup.string().required("Address line can not be blank"),
  country: Yup.object().shape({
    value: Yup.string().required("Country can not be blank"),
  }),
  state: Yup.object().shape({
    value: Yup.string().required("State can not be blank"),
  }),
  city: Yup.object().shape({
    value: Yup.string().required("City can not be blank"),
  }),
  zipcode: Yup.string().required("Zipcode line can not be blank"),
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
