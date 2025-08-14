import React, { useEffect, useState } from "react";

import clientApi from "apis/clients";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { InputErrors, InputField } from "common/FormikFields";
import { Form, Formik, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Button, SidePanel, Toastr } from "StyledComponents";
import worldCountries from "world-countries";

import { clientSchema, getInitialvalues } from "./formValidationSchema";
import UploadLogo from "./UploadLogo";
import { formatFormData, disableBtn } from "./utils";

import { currencyListOptions } from "../../OrganizationSetup/FinancialDetailsForm/utils";

const MobileClientForm = ({
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
  handleEdit,
  setShowDialog,
  fetchDetails,
}: IClientForm) => {
  const [fileUploadError, setFileUploadError] = useState<string>("");
  const [countries, setCountries] = useState([]);

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.cca2,
      label: country.name.common,
      code: country.cca2,
    }));
    setCountries(countryData);
  };

  useEffect(() => {
    assignCountries(worldCountries);
  }, []);

  const handleSubmit = async values => {
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
        setClientData([...clientData, { ...res.data, minutes: 0 }]);
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
    <SidePanel
      WrapperClassname="z-50 justify-content-between lg:hidden bg-white"
      setFilterVisibilty={setShowDialog}
    >
      <SidePanel.Header className="mb-2 flex items-center justify-between bg-miru-han-purple-1000 px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-miru-dark-purple-1000">
        <span className="flex w-full items-center justify-center pl-6 text-base font-medium leading-5">
          {client?.id ? "Edit Client" : "Add New Client"}
        </span>
        <Button style="ternary" onClick={() => setShowDialog(false)}>
          <XIcon
            className="text-white lg:text-miru-dark-purple-1000"
            size={16}
          />
        </Button>
      </SidePanel.Header>
      <SidePanel.Body className="sidebar__filters flex h-full flex-col justify-between overflow-y-auto px-4">
        <Formik
          initialValues={getInitialvalues(client)}
          validationSchema={clientSchema}
          onSubmit={handleSubmit}
        >
          {(props: FormikProps<FormValues>) => {
            const { touched, errors, setFieldValue, values } = props;

            return (
              <Form>
                <div className="mt-4">
                  <div className="my-4">
                    <div className="field">
                      <div className="mt-1">
                        <UploadLogo
                          clientLogoUrl={clientLogoUrl}
                          formType={formType}
                          handleDeleteLogo={handleDeleteLogo}
                          setClientLogo={setClientLogo}
                          setClientLogoUrl={setClientLogoUrl}
                          setFileUploadError={setFileUploadError}
                        />
                        <p className="mt-3 block max-w-xs text-center text-xs tracking-wider text-red-600">
                          {fileUploadError}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="field relative">
                  <InputField
                    autoFocus
                    resetErrorOnChange
                    id="name"
                    label="Name"
                    marginBottom="mb-0"
                    name="name"
                    setFieldValue={setFieldValue}
                  />
                  <InputErrors
                    fieldErrors={errors.name}
                    fieldTouched={touched.name}
                  />
                </div>
                <div className="mt-4">
                  <div className="field relative">
                    <div className="flex flex-col">
                      <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white p-4 pt-2">
                        <PhoneInput
                          className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                          flags={flags}
                          id="phone"
                          inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none"
                          name="phone"
                          smartCaret={false}
                          value={formType == "edit" ? client.phone : ""}
                          onChange={phone => {
                            setFieldValue("phone", phone);
                          }}
                        />
                        <label
                          className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300"
                          htmlFor="phone"
                        >
                          Phone
                        </label>
                      </div>
                    </div>
                    <InputErrors
                      fieldErrors={errors.phone}
                      fieldTouched={errors.phone}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field relative">
                    <InputField
                      resetErrorOnChange
                      id="address1"
                      label="Address line 1"
                      name="address1"
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.address1}
                      fieldTouched={touched.address1}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field relative mb-5">
                    <InputField
                      resetErrorOnChange
                      id="address2"
                      label="Address line 2 (optional)"
                      name="address2"
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.address2}
                      fieldTouched={touched.address2}
                    />
                  </div>
                </div>
                <div className="mb-5 flex flex-row">
                  <div className="flex w-1/2 flex-col py-0 pr-2">
                    <div className="field relative">
                      <label className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300">
                        Country
                      </label>
                      <Select
                        value={values.country?.value || ""}
                        onValueChange={value => {
                          const selectedCountry = countries.find(
                            c => c.value === value
                          );
                          if (selectedCountry) {
                            setFieldValue("country", selectedCountry);
                            setFieldValue("state", "");
                            setFieldValue("city", "");
                            setFieldValue("zipcode", "");
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`h-12 ${
                            errors.country && touched.country
                              ? "border-red-500"
                              : ""
                          }`}
                        >
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem
                              key={country.value}
                              value={country.value}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex w-1/2 flex-col pl-2">
                    <InputField
                      resetErrorOnChange
                      id="state"
                      label="State"
                      name="state"
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      addMargin={false}
                      fieldErrors={errors.state}
                      fieldTouched={touched.state}
                    />
                  </div>
                </div>
                <div className="flex flex-row">
                  <div className="flex w-1/2 flex-col pr-2" id="city">
                    <InputField
                      resetErrorOnChange
                      id="city"
                      label="City"
                      name="city"
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.city}
                      fieldTouched={touched.city}
                    />
                  </div>
                  <div className="flex w-1/2 flex-col pl-2">
                    <InputField
                      resetErrorOnChange
                      id="zipcode"
                      label="Zipcode"
                      name="zipcode"
                      setFieldValue={setFieldValue}
                    />
                    <InputErrors
                      fieldErrors={errors.zipcode}
                      fieldTouched={touched.zipcode}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="field relative mb-5">
                    <label className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300">
                      Currency
                    </label>
                    <Select
                      value={values.currency?.value || ""}
                      onValueChange={value => {
                        const selectedCurrency = currencyListOptions.find(
                          c => c.value === value
                        );
                        if (selectedCurrency) {
                          setFieldValue("currency", selectedCurrency);
                        }
                      }}
                    >
                      <SelectTrigger
                        className={`h-12 ${
                          errors.currency && touched.currency
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyListOptions.map(currency => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="actions mt-auto">
                  {client?.id ? (
                    <Button
                      className="w-full p-2 text-center text-base font-bold"
                      disabled={disableBtn(values, errors, submitting)}
                      style="primary"
                      type="submit"
                      onClick={handleEdit}
                    >
                      Save Changes
                    </Button>
                  ) : (
                    <Button
                      className="w-full p-2 text-center text-base font-bold"
                      disabled={disableBtn(values, errors, submitting)}
                      style="primary"
                      type="submit"
                      onClick={() => {
                        handleSubmit(values);
                        setSubmitting(true);
                      }}
                    >
                      Add Client
                    </Button>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
      </SidePanel.Body>
    </SidePanel>
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
  submitting: any;
  setSubmitting: any;
  handleEdit?: any;
  setShowDialog: any;
  fetchDetails?: any;
}

interface FormValues {
  name: string;
  phone: string;
  address1: string;
  address2: string;
  country: any;
  state: any;
  city: any;
  zipcode: string;
  currency: any;
  logo: any;
}

export default MobileClientForm;
