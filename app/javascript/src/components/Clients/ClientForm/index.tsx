import React, { useEffect, useState } from "react";

import { Formik, Form, FormikProps } from "formik";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { Toastr } from "StyledComponents";
import worldCountries from "world-countries";
import { clientApi } from "apis/api";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";

import { clientSchema, getInitialvalues } from "./formValidationSchema";
import UploadLogo from "./UploadLogo";
import { disableBtn, formatFormData } from "./utils";

import { currencyListOptions } from "../../OrganizationSetup/FinancialDetailsForm/utils";

const ClientForm = ({
  client,
  clientLogoUrl,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType = "new",
  setClientData,
  setnewClient,
  clientLogo,
  setShowEditDialog,
  submitting,
  setSubmitting,
  fetchDetails,
}: IClientForm) => {
  const [fileUploadError, setFileUploadError] = useState<string>("");
  const [countries, setCountries] = useState([]);

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country?.cca2 && country.cca2,
      label: country.name.common,
      code: country?.cca2 && country?.cca2,
    }));
    setCountries(countryData);
  };

  useEffect(() => {
    assignCountries(worldCountries);
  }, []);

  const handleSubmit = async values => {
    setSubmitting(true);
    const formData = new FormData();
    formatFormData(
      formData,
      values,
      formType === "new",
      client,
      clientLogo,
      clientLogoUrl
    );
    if (formType === "new") {
      try {
        const res = await clientApi.create(formData);
        setClientData([...clientData, { ...res.data.client, minutes: 0 }]);
        setnewClient(false);
        Toastr.success("Client added successfully");
      } catch {
        setSubmitting(false);
      }
    } else {
      try {
        await clientApi.update(client.id, formData);
        setShowEditDialog(false);
        fetchDetails();
      } catch {
        setSubmitting(false);
      }
    }
  };

  return (
    <Formik
      initialValues={getInitialvalues(client)}
      validationSchema={clientSchema}
      onSubmit={handleSubmit}
    >
      {(props: FormikProps<FormValues>) => {
        const {
          touched,
          errors,
          setFieldValue,
          values,
          handleChange,
          handleBlur,
        } = props;

        return (
          <Form className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <UploadLogo
                clientLogoUrl={clientLogoUrl}
                formType={formType}
                handleDeleteLogo={handleDeleteLogo}
                setClientLogo={setClientLogo}
                setClientLogoUrl={setClientLogoUrl}
                setFileUploadError={setFileUploadError}
              />
              {fileUploadError && (
                <p className="mt-2 text-center text-xs text-red-600">
                  {fileUploadError}
                </p>
              )}
            </div>
            {/* Name Field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0 }}
            >
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                autoFocus
                id="name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.name && touched.name ? "border-red-500" : ""}
              />
              {errors.name && touched.name && (
                <p className="text-xs text-red-600">{errors.name}</p>
              )}
            </motion.div>
            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <PhoneInput
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  flags={flags}
                  id="phone"
                  inputClassName="!border-0 !outline-none !p-0 !m-0 !h-auto !bg-transparent"
                  name="phone"
                  value={values.phone}
                  onChange={phone => setFieldValue("phone", phone)}
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="text-xs text-red-600">{errors.phone}</p>
              )}
            </div>
            {/* Address Line 1 */}
            <div className="space-y-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                name="address1"
                value={values.address1}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  errors.address1 && touched.address1 ? "border-red-500" : ""
                }
              />
              {errors.address1 && touched.address1 && (
                <p className="text-xs text-red-600">{errors.address1}</p>
              )}
            </div>
            {/* Address Line 2 */}
            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2 (optional)</Label>
              <Input
                id="address2"
                name="address2"
                value={values.address2}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  errors.address2 && touched.address2 ? "border-red-500" : ""
                }
              />
              {errors.address2 && touched.address2 && (
                <p className="text-xs text-red-600">{errors.address2}</p>
              )}
            </div>
            {/* Country and State Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={values.country?.value || ""}
                  onValueChange={value => {
                    const selectedCountry = countries.find(
                      (c: any) => c.value === value
                    );
                    setFieldValue("country", selectedCountry || null);
                    setFieldValue("state", "");
                    setFieldValue("city", "");
                    setFieldValue("zipcode", "");
                  }}
                >
                  <SelectTrigger
                    className={
                      errors.country && touched.country ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country: any) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && touched.country && (
                  <p className="text-xs text-red-600">{errors.country}</p>
                )}
              </div>
              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={values.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    errors.state && touched.state ? "border-red-500" : ""
                  }
                />
                {errors.state && touched.state && (
                  <p className="text-xs text-red-600">{errors.state}</p>
                )}
              </div>
            </div>
            {/* City and Zipcode Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={values.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    errors.city && touched.city ? "border-red-500" : ""
                  }
                />
                {errors.city && touched.city && (
                  <p className="text-xs text-red-600">{errors.city}</p>
                )}
              </div>
              {/* Zipcode */}
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zipcode</Label>
                <Input
                  id="zipcode"
                  name="zipcode"
                  value={values.zipcode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    errors.zipcode && touched.zipcode ? "border-red-500" : ""
                  }
                />
                {errors.zipcode && touched.zipcode && (
                  <p className="text-xs text-red-600">{errors.zipcode}</p>
                )}
              </div>
            </div>
            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={values.currency?.value || ""}
                onValueChange={value => {
                  const selectedCurrency = currencyListOptions.find(
                    (c: any) => c.value === value
                  );
                  setFieldValue("currency", selectedCurrency || null);
                }}
              >
                <SelectTrigger
                  className={
                    errors.currency && touched.currency ? "border-red-500" : ""
                  }
                >
                  <SelectValue placeholder="Select currency..." />
                </SelectTrigger>
                <SelectContent>
                  {currencyListOptions.map((currency: any) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && touched.currency && (
                <p className="text-xs text-red-600">{errors.currency}</p>
              )}
            </div>
            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={disableBtn(values, errors, submitting)}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

interface IClientForm {
  client?: any;
  clientLogoUrl: string;
  handleDeleteLogo: any;
  setClientLogoUrl: any;
  setClientLogo: any;
  formType?: string;
  clientData?: any;
  setClientData?: any;
  setnewClient?: any;
  clientLogo?: any;
  setShowEditDialog?: any;
  submitting: boolean;
  setSubmitting: any;
  fetchDetails?: any;
}

interface FormValues {
  name: string;
  phone: string;
  address1: string;
  address2: string;
  country: any;
  state: string;
  city: string;
  zipcode: string;
  currency: any;
  logo: any;
}

export default ClientForm;
