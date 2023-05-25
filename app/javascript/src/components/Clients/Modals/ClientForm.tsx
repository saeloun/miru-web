/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import "react-phone-number-input/style.css"; //eslint-disable-line
import { Country, State, City } from "country-state-city";
import { Formik, Form, FormikProps } from "formik";
import { EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Avatar, Toastr } from "StyledComponents";

import clientApi from "apis/clients";
import CustomReactSelect from "common/CustomReactSelect";
import { InputErrors, InputField } from "common/FormikFields";

import { clientSchema, getInitialvalues } from "./formValidationSchema";
import { formatFormData } from "./utils";

import { i18n } from "../../../i18n";

interface IClientForm {
  clientLogoUrl: string;
  handleDeleteLogo: any;
  setClientLogoUrl: any;
  setClientLogo: any;
  formType?: string;
  clientData?: any;
  setClientData?: any;
  setnewClient?: any;
  clientLogo?: any;
  setApiError?: any;
  setShowEditDialog?: any;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  country: any;
  state: any;
  city: any;
  zipcode: string;
  logo: any;
}

const ClientForm = ({
  clientLogoUrl,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType = "new",
  setClientData,
  setnewClient,
  clientLogo,
  setApiError,
  setShowEditDialog,
}: IClientForm) => {
  const [fileUploadError, setFileUploadError] = useState<string>("");
  const [countries, setCountries] = useState([]);

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country?.isoCode && country.isoCode,
      label: country.name,
      code: country?.isoCode && country?.isoCode,
    }));
    setCountries(countryData);
  };

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    assignCountries(allCountries);
  }, []);

  const updatedStates = countryCode =>
    State.getStatesOfCountry(countryCode).map(state => ({
      label: state.name,
      value: state.name,
      code: state?.isoCode && state.isoCode,
      ...state,
    }));

  const updatedCities = values => {
    const allStates = State.getAllStates();
    const currentCity = allStates.filter(
      state => state.name == values.state.label
    );

    const cities = City.getCitiesOfState(
      values.country.code,
      currentCity[0] && currentCity[0].isoCode
    ).map(city => ({
      label: city.name,
      value: city.name,
      ...city,
    }));

    return cities;
  };

  const onLogoChange = e => {
    const file = e.target.files[0];
    const isValid = isValidFileUploaded(file);

    if (isValid.fileExtension && isValid.fileSizeValid) {
      setClientLogoUrl(URL.createObjectURL(file));
      setClientLogo(file);
    } else {
      if (!isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(
          i18n.t("invalidImageFormatSize", { fileSize: "30" })
        );
      } else if (isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(i18n.t("invalidImageSize", { fileSize: "30" }));
      } else {
        setFileUploadError(i18n.t("invalidImageFormat"));
      }
    }
  };

  const isValidFileUploaded = file => {
    const validExtensions = ["png", "jpeg", "jpg"];
    const fileExtensions = file.type.split("/")[1];
    const validFileByteSize = "30000";
    const fileSize = file.size;

    return {
      fileExtension: validExtensions.includes(fileExtensions),
      fileSizeValid: fileSize <= validFileByteSize,
    };
  };

  const handleSubmit = async values => {
    const formData = new FormData();

    formatFormData(
      formData,
      values,
      formType === "new",
      clientData,
      clientLogo,
      clientLogoUrl
    );
    if (formType === "new") {
      try {
        const res = await clientApi.create(formData);
        setClientData([...clientData, { ...res.data, minutes: 0 }]);
        setnewClient(false);
        Toastr.success("Client added successfully");
      } catch (error) {
        setApiError(error.message);
      }
    } else {
      await clientApi
        .update(clientData.id, formData)
        .then(() => {
          setShowEditDialog(false);
          window.location.reload();
        })
        .catch(e => {
          setApiError(e.message);
        });
    }
  };

  const LogoComponent = () => (
    <div className="my-4 flex flex-row">
      <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400">
        <div className="profile-img relative m-auto h-30 w-30 cursor-pointer text-center text-xs font-semibold">
          <Avatar
            classNameImg="h-full w-full md:h-full md:w-full"
            url={clientLogoUrl}
          />
          <div className="hover-edit absolute top-0 left-0 h-full w-full bg-miru-white-1000 p-4 opacity-80">
            <button
              className="flex flex-row text-miru-han-purple-1000"
              type="button"
            >
              <label className="flex cursor-pointer" htmlFor="file_input">
                <img
                  alt="edit"
                  className="cursor-pointer rounded-full"
                  src={EditImageButtonSVG}
                  style={{ minWidth: "40px" }}
                />
                <p className="my-auto">Edit</p>
              </label>
              <input
                className="hidden"
                id="file_input"
                name="logo"
                type="file"
                onChange={onLogoChange}
              />
            </button>
            {clientLogoUrl && (
              <button
                className="flex flex-row pl-2 text-miru-red-400"
                type="button"
                onClick={handleDeleteLogo}
              >
                <img
                  alt="delete"
                  src={deleteImageIcon}
                  style={{ minWidth: "20px" }}
                />
                <p className="pl-3">Delete</p>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
        <p>Accepted file formats: PNG and JPG.</p>
        <p>File size should be &#8826; 30 KB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
      <input
        className="hidden"
        id="file_input"
        name="logo"
        type="file"
        onClick={onLogoChange}
      />
    </div>
  );

  return (
    <Formik
      initialValues={getInitialvalues(clientData)}
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
                    {formType == "edit" ? (
                      <LogoComponent />
                    ) : clientLogoUrl ? (
                      <LogoComponent />
                    ) : (
                      <div className="mt-2 flex flex-row">
                        <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400 ">
                          <label
                            className="flex h-full w-full cursor-pointer justify-center"
                            htmlFor="file-input"
                          >
                            <div className="m-auto cursor-pointer text-center text-xs font-semibold">
                              <p className="text-miru-han-purple-1000">
                                Select File
                              </p>
                            </div>
                          </label>
                          <input
                            className="hidden"
                            id="file-input"
                            name="logo"
                            type="file"
                            onChange={onLogoChange}
                          />
                        </div>
                        <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
                          <p>Accepted file formats: PNG and JPG.</p>
                          <p>File size should be &#8826; 30 KB.</p>
                          <p>Image resolution should be 1:1.</p>
                        </div>
                      </div>
                    )}
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
                hasError={errors.name && touched.name}
                id="name"
                label="Name"
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
                <InputField
                  resetErrorOnChange
                  hasError={errors.email && touched.email}
                  id="email"
                  label="Email"
                  name="email"
                  setFieldValue={setFieldValue}
                />
                <InputErrors
                  fieldErrors={errors.email}
                  fieldTouched={touched.email}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="field relative">
                <div className="flex flex-col">
                  <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white p-4 pt-2">
                    <PhoneInput
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                      flags={flags}
                      id="phone"
                      inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none "
                      name="phone"
                      value={clientData.phone}
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
                  fieldTouched={touched.phone}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="field relative">
                <InputField
                  resetErrorOnChange
                  hasError={errors.address1 && touched.address1}
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
                  hasError={errors.address2 && touched.address2}
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
                <CustomReactSelect
                  isErr={!!errors.country && touched.country}
                  label="Country"
                  name="country"
                  options={countries}
                  value={values.country.value ? values.country : null}
                  handleOnChange={e => {
                    setFieldValue("country", e);
                    setFieldValue("state", "");
                    setFieldValue("city", "");
                    setFieldValue("zipcode", "");
                  }}
                />
              </div>
              <div className="flex w-1/2 flex-col pl-2">
                <CustomReactSelect
                  id="state"
                  isErr={!!errors.state && touched.state}
                  label="State"
                  name="state"
                  value={values.state ? values.state : null}
                  handleOnChange={state => {
                    setFieldValue("state", state);
                    setFieldValue("city", "");
                    setFieldValue("zipcode", "");
                    updatedCities(values);
                  }}
                  options={updatedStates(
                    values.country.code ? values.country.code : "US"
                  )}
                />
              </div>
            </div>
            <div className="flex flex-row">
              <div className="flex w-1/2 flex-col pr-2" id="city">
                <CustomReactSelect
                  handleOnChange={city => setFieldValue("city", city)}
                  id="city-list"
                  isErr={!!errors.city && touched.city}
                  label="City"
                  name="city"
                  options={updatedCities(values)}
                  value={values.city.value ? values.city : null}
                />
              </div>
              <div className="flex w-1/2 flex-col pl-2">
                <InputField
                  resetErrorOnChange
                  hasError={errors.zipcode && touched.zipcode}
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
            <div className="actions mt-4">
              <input
                className="form__input_submit"
                name="commit"
                type="submit"
                value="SAVE CHANGES"
              />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ClientForm;
