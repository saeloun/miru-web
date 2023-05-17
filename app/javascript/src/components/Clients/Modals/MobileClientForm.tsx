/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import { Country, State, City } from "country-state-city";
import { Form, Formik, FormikProps } from "formik";
import { XIcon, EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Avatar, Button, SidePanel, Toastr } from "StyledComponents";

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
  apiError?: string;
  setClientData?: any;
  setnewClient?: any;
  clientLogo?: any;
  setApiError?: any;
  setShowEditDialog?: any;
  submitting: any;
  setSubmitting: any;
  handleEdit?: any;
  setShowDialog: any;
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

const MobileClientForm = ({
  clientLogoUrl,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType = "new",
  apiError = "",
  setClientData,
  setnewClient,
  clientLogo,
  setApiError,
  setShowEditDialog,
  submitting,
  setSubmitting,
  handleEdit,
  setShowDialog,
}: IClientForm) => {
  const [fileUploadError, setFileUploadError] = useState<string>("");
  const [countries, setCountries] = useState([]);

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.isoCode,
      label: country.name,
      code: country.isoCode,
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
      code: state.isoCode,
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
        setSubmitting(false);
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
          setSubmitting(false);
        });
    }
  };

  const disableBtn = (values, errors) => {
    if (
      errors.name ||
      errors.email ||
      errors.phone ||
      errors.address1 ||
      errors.country ||
      errors.state ||
      errors.city ||
      errors.zipcode ||
      submitting
    ) {
      return true;
    }

    if (
      values.name &&
      values.email &&
      values.phone &&
      values.address1 &&
      values.country &&
      values.state &&
      values.city &&
      values.zipcode
    ) {
      return false;
    }

    return true;
  };

  const LogoComponent = () => (
    <div className="my-4 flex flex-row">
      <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400">
        <div className="profile-img relative m-auto cursor-pointer text-center text-xs font-semibold">
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
    <SidePanel
      WrapperClassname="z-50 justify-content-between lg:hidden bg-white"
      setFilterVisibilty={setShowDialog}
    >
      <SidePanel.Header className="mb-2 flex items-center justify-between bg-miru-han-purple-1000 px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-miru-dark-purple-1000">
        <span className="flex w-full items-center justify-center pl-6 text-base font-medium leading-5">
          {clientData?.id ? "Edit Client" : "Add New Client"}
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
                          inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none"
                          name="phone"
                          smartCaret={false}
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
                      isErr={!!errors.state && touched.state}
                      label="State"
                      name="state"
                      value={values.state.value ? values.state : null}
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
                <p className="mt-3 block text-xs tracking-wider text-red-600">
                  {apiError}
                </p>
                <div className="actions mt-auto">
                  {clientData?.id ? (
                    <Button
                      className="w-full p-2 text-center text-base font-bold"
                      disabled={disableBtn(values, errors)}
                      style="primary"
                      type="submit"
                      onClick={handleEdit}
                    >
                      Save Changes
                    </Button>
                  ) : (
                    <Button
                      className="w-full p-2 text-center text-base font-bold"
                      disabled={disableBtn(values, errors)}
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

export default MobileClientForm;
