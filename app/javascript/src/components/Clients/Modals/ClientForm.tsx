/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import "react-phone-number-input/style.css"; //eslint-disable-line
import { Country, State, City } from "country-state-city";
import { Formik, Form, FormikProps } from "formik";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Avatar } from "StyledComponents";
import * as Yup from "yup";

import { CustomAsyncSelect } from "common/CustomAsyncSelect";
import CustomReactSelect from "common/CustomReactSelect";
import { InputErrors, InputField } from "common/FormikFields";

import { i18n } from "../../../i18n";

const deleteImage = require("../../../../../assets/images/delete.svg");
const editButton = require("../../../../../assets/images/edit_image_button.svg");
const img = require("../../../../../assets/images/plus_icon.svg");

interface IClientForm {
  clientLogoUrl: string;
  handleSubmit: any;
  handleDeleteLogo: any;
  setClientLogoUrl: any;
  setClientLogo: any;
  formType?: string;
  clientData?: any;
  apiError?: string;
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

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

const clientSchema = Yup.object().shape({
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

const getInitialvalues = (client?: any) => ({
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

const ClientForm = ({
  clientLogoUrl,
  handleSubmit,
  handleDeleteLogo,
  setClientLogoUrl,
  setClientLogo,
  clientData,
  formType = "new",
  apiError = "",
}: IClientForm) => {
  const initialSelectValue = {
    label: "",
    value: "",
    code: "",
  };
  const [fileUploadError, setFileUploadError] = useState<string>("");
  const [countries, setCountries] = useState([]);
  const [currentCountryDetails, setCurrentCountryDetails] =
    useState(initialSelectValue);
  const [currentCityList, setCurrentCityList] = useState([]);

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

  const filterCities = (inputValue: string) => {
    const city = currentCityList.filter(i =>
      i.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    return city.length ? city : [{ label: inputValue, value: inputValue }];
  };

  const promiseOptions = (inputValue: string) =>
    new Promise(resolve => {
      setTimeout(() => {
        resolve(filterCities(inputValue));
      }, 1000);
    });

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

  const LogoComponent = () => (
    <div className="mt-2 flex flex-row items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center">
        <Avatar url={clientLogoUrl} />
      </div>
      <input
        className="hidden"
        id="file_input"
        name="logo"
        type="file"
        onChange={onLogoChange}
      />
      <label htmlFor="file_input">
        <img
          alt="edit"
          className="cursor-pointer rounded-full"
          src={editButton}
          style={{ minWidth: "40px" }}
        />
      </label>
      <input
        className="hidden"
        id="file_input"
        name="logo"
        type="file"
        onClick={onLogoChange}
      />
      {clientLogoUrl && (
        <button type="button" onClick={handleDeleteLogo}>
          <img alt="delete" src={deleteImage} style={{ minWidth: "20px" }} />
        </button>
      )}
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
              <div className="mt-4">
                <div className="field">
                  <div className="mt-1">
                    {formType == "edit" ? (
                      <LogoComponent />
                    ) : clientLogoUrl ? (
                      <LogoComponent />
                    ) : (
                      <div className="mt-2 flex flex-row justify-center">
                        <div className="mt-2 h-20 w-20 rounded-full border border-miru-han-purple-1000 ">
                          <label
                            className="flex h-full w-full cursor-pointer justify-center"
                            htmlFor="file-input"
                          >
                            <img
                              alt="profile_box"
                              className="object-none"
                              src={img}
                            />
                          </label>
                          <input
                            className="hidden"
                            id="file-input"
                            name="logo"
                            type="file"
                            onChange={onLogoChange}
                          />
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
                id="name"
                label="Name"
                name="name"
                resetErrorOnChange={false}
              />
              <InputErrors
                fieldErrors={errors.name}
                fieldTouched={touched.name}
              />
            </div>
            <div className="mt-4">
              <div className="field relative">
                <InputField
                  id="email"
                  label="Email"
                  name="email"
                  resetErrorOnChange={false}
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
                  id="address1"
                  label="Address line 1"
                  name="address1"
                  resetErrorOnChange={false}
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
                  id="address2"
                  label="Address line 2 (optional)"
                  name="address2"
                  resetErrorOnChange={false}
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
                    setCurrentCountryDetails(e);
                    setFieldValue("country", e);
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
                    const cities = City.getCitiesOfState(
                      currentCountryDetails.code,
                      state.code
                    ).map(city => ({
                      label: city.name,
                      value: city.name,
                      ...city,
                    }));
                    setCurrentCityList(cities);
                  }}
                  options={updatedStates(
                    currentCountryDetails.code
                      ? currentCountryDetails.code
                      : "US"
                  )}
                />
              </div>
            </div>
            <div className="flex flex-row">
              <div className="flex w-1/2 flex-col pr-2">
                <CustomAsyncSelect
                  isErr={!!errors.city && touched.city}
                  label="City"
                  loadOptions={promiseOptions}
                  name="city"
                  value={values.city.value ? values.city : null}
                  handleOnChange={city => {
                    setFieldValue("city", city);
                  }}
                />
              </div>
              <div className="flex w-1/2 flex-col pl-2">
                <InputField
                  id="zipcode"
                  label="zipcode"
                  name="zipcode"
                  resetErrorOnChange={false}
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
