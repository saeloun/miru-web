import React, { useEffect, useState } from "react";

import { Formik, Form, FormikProps } from "formik";
import { EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import Select, { components } from "react-select";
import { Avatar } from "StyledComponents";
import worldCountries from "world-countries";

import companyProfileApi from "apis/companyProfile";
import CustomReactSelect from "common/CustomReactSelect";
import { InputErrors, InputField } from "common/FormikFields";

import { CompanyDetailsFormProps, CompanyDetailsFormValues } from "./interface";
import {
  companyDetailsFormInitialValues,
  companyDetailsFormValidationSchema,
} from "./utils";

import { i18n } from "../../../i18n";

const { ValueContainer, Placeholder } = components;
const customStyles = {
  control: provided => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    color: "red",
    minHeight: 48,
    padding: "0",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "handleCountryChange2px",
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-45%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  }),
};

const CustomValueContainer = props => {
  const { children } = props;

  return (
    <ValueContainer {...props}>
      <Placeholder {...props}>{props.selectProps.placeholder}</Placeholder>
      {React.Children.map(children, child =>
        child && child.key !== "placeholder" ? child : null
      )}
    </ValueContainer>
  );
};

const CompanyDetailsForm = ({
  onNextBtnClick,
  isFormAlreadySubmitted = false,
  previousSubmittedValues = null,
  formType = "New",
  isDesktop,
}: CompanyDetailsFormProps) => {
  const [allTimezones, setAllTimezones] = useState({});
  const [timezonesOfSelectedCountry, setTimezonesOfSelectedCountry] = useState(
    []
  );
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
    getAllTimezones();
    assignCountries(worldCountries);
  }, []);

  useEffect(() => {
    if (Object.keys(allTimezones || {})?.length) {
      const selectedCountryCode = isFormAlreadySubmitted
        ? previousSubmittedValues.country?.value
        : companyDetailsFormInitialValues?.country?.code || "US";
      getTimezonesOfCurrentCountry(selectedCountryCode);
    }
  }, [allTimezones]); // eslint-disable-line

  const getAllTimezones = async () => {
    const res = await companyProfileApi.get();
    const tempAllTimezones = res?.data?.timezones || [];
    setAllTimezones(tempAllTimezones);
  };

  const getTimezonesOfCurrentCountry = (
    countryCode: string,
    setFieldValue?: any
  ) => {
    const timezoneOfSelectedCountry = allTimezones[countryCode];
    const formattedTimeZoneOptions = timezoneOfSelectedCountry?.map(
      timezone => ({ value: timezone, label: timezone })
    );
    if (setFieldValue) {
      setFieldValue("timezone", formattedTimeZoneOptions[0]);
    }
    setTimezonesOfSelectedCountry(formattedTimeZoneOptions);
  };

  const onLogoChange = (e, setFieldValue) => {
    const file = e.target.files[0];
    const logoUrl = URL.createObjectURL(file);
    const isValid = isValidFileUploaded(file);

    if (isValid.fileExtension && isValid.fileSizeValid) {
      setFieldValue("logo_url", logoUrl);
      setFieldValue("logo", file);
    } else {
      if (!isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(
          i18n.t("invalidImageFormatSize", { fileSize: "2000" })
        );
      } else if (isValid.fileExtension && !isValid.fileSizeValid) {
        setFileUploadError(i18n.t("invalidImageSize", { fileSize: "2000" }));
      } else {
        setFileUploadError(i18n.t("invalidImageFormat"));
      }
    }
  };

  const isValidFileUploaded = file => {
    const validExtensions = ["png", "jpeg", "jpg"];
    const fileExtensions = file.type.split("/")[1];
    const validFileByteSize = "2000000";
    const fileSize = file.size;

    return {
      fileExtension: validExtensions.includes(fileExtensions),
      fileSizeValid: fileSize <= validFileByteSize,
    };
  };

  const isBtnDisabled = (values: CompanyDetailsFormValues) =>
    !(
      values.country?.value?.trim() &&
      values.state?.trim() &&
      values.city?.trim() &&
      values.timezone?.value?.trim() &&
      values.address_line_1?.trim() &&
      values.zipcode?.trim()
    );

  const LogoComponent = ({ values, setFieldValue }) => (
    <div className="my-4 flex flex-row">
      <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400">
        <div className="profile-img relative m-auto h-30 w-30 cursor-pointer text-center text-xs font-semibold">
          <Avatar
            classNameImg="h-full w-full md:h-full md:w-full"
            url={values?.logo_url}
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
                onChange={e => onLogoChange(e, setFieldValue)}
              />
            </button>
            <button
              className="flex flex-row pl-2 text-miru-red-400"
              type="button"
              onClick={() => setFieldValue("logo_url", null)}
            >
              <img
                alt="delete"
                src={deleteImageIcon}
                style={{ minWidth: "20px" }}
              />
              <p className="pl-3">Delete</p>
            </button>
          </div>
        </div>
      </div>
      <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
        <p>Accepted file formats: PNG, JPG, SVG.</p>
        <p>File size should be &#8826; 2MB.</p>
        <p>Image resolution should be 1:1.</p>
      </div>
      <input
        className="hidden"
        id="file_input"
        name="logo"
        type="file"
        onClick={e => onLogoChange(e, setFieldValue)}
      />
    </div>
  );

  return (
    <div>
      <Formik
        validateOnBlur={false}
        validationSchema={companyDetailsFormValidationSchema}
        initialValues={
          isFormAlreadySubmitted
            ? previousSubmittedValues
            : companyDetailsFormInitialValues
        }
        onSubmit={onNextBtnClick}
      >
        {(props: FormikProps<CompanyDetailsFormValues>) => {
          const { touched, errors, setFieldValue, values } = props;

          return (
            <Form>
              <div className="my-4">
                <div className="field">
                  <div className="mt-1">
                    {formType == "edit" ? (
                      <LogoComponent
                        setFieldValue={setFieldValue}
                        values={values}
                      />
                    ) : values?.logo_url ? (
                      <LogoComponent
                        setFieldValue={setFieldValue}
                        values={values}
                      />
                    ) : (
                      <div className="mt-2 flex flex-row">
                        <div className="mt-2 h-30 w-30 border border-dashed border-miru-dark-purple-400 ">
                          <label
                            className="flex h-full w-full cursor-pointer justify-center"
                            htmlFor="file-input"
                          >
                            <div className="m-auto cursor-pointer text-center text-xs font-semibold">
                              {isDesktop && (
                                <>
                                  <p className="text-miru-dark-purple-400">
                                    Drag logo
                                  </p>
                                  <p className="text-miru-dark-purple-400">
                                    or
                                  </p>
                                </>
                              )}
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
                            onChange={e => onLogoChange(e, setFieldValue)}
                          />
                        </div>
                        <div className="my-auto ml-6 text-xs font-normal text-miru-dark-purple-400">
                          <p>Accepted file formats: PNG, JPG, SVG.</p>
                          <p>File size should be &#8826; 2MB.</p>
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
              <div className="field relative">
                <InputField
                  autoFocus
                  resetErrorOnChange
                  hasError={errors.company_name && touched.company_name}
                  id="company_name"
                  label="Company Name"
                  name="company_name"
                  setFieldValue={setFieldValue}
                />
                <InputErrors
                  fieldErrors={errors.company_name}
                  fieldTouched={touched.company_name}
                />
              </div>
              <div className="field relative">
                <div className="flex flex-col">
                  <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white p-4 pt-2">
                    <PhoneInput
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                      flags={flags}
                      id="business_phone"
                      inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none "
                      name="business_phone"
                      value={values.business_phone}
                      onChange={phone => {
                        setFieldValue("business_phone", phone);
                      }}
                    />
                    <label
                      className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300"
                      htmlFor="business_phone"
                    >
                      Business Phone
                    </label>
                  </div>
                </div>
                <InputErrors
                  fieldErrors={errors.business_phone}
                  fieldTouched={touched.business_phone}
                />
              </div>
              <div className="field relative mt-4">
                <InputField
                  resetErrorOnChange
                  hasError={errors.address_line_1 && touched.address_line_1}
                  id="address_line_1"
                  label="Address line 1"
                  name="address_line_1"
                  setFieldValue={setFieldValue}
                />
                <InputErrors
                  fieldErrors={errors.address_line_1}
                  fieldTouched={touched.address_line_1}
                />
              </div>
              <div className="field relative mb-5">
                <InputField
                  resetErrorOnChange
                  hasError={errors.address_line_2 && touched.address_line_2}
                  id="address_line_2"
                  label="Address line 2 (optional)"
                  name="address_line_2"
                  setFieldValue={setFieldValue}
                />
                <InputErrors
                  fieldErrors={errors.address_line_2}
                  fieldTouched={touched.address_line_2}
                />
              </div>
              {/* Country */}
              <div className="flex flex-row">
                <div className="flex w-1/2 flex-col py-0 pr-2">
                  <CustomReactSelect
                    isErr={!!errors.country}
                    label="Country"
                    name="country"
                    options={countries}
                    value={values.country.value ? values.country : null}
                    handleOnChange={e => {
                      getTimezonesOfCurrentCountry(e.code, setFieldValue);
                      setFieldValue("country", e);
                      setFieldValue("state", "");
                      setFieldValue("city", "");
                    }}
                  />
                </div>
                <div className="flex w-1/2 flex-col pl-2">
                  <InputField
                    resetErrorOnChange
                    hasError={errors.state && touched.state}
                    id="state"
                    label="State"
                    name="state"
                    setFieldValue={setFieldValue}
                  />
                  <InputErrors
                    fieldErrors={errors.state}
                    fieldTouched={touched.state}
                  />
                </div>
              </div>
              <div className="flex flex-row">
                <div className="flex w-1/2 flex-col pr-2">
                  <InputField
                    resetErrorOnChange
                    hasError={errors.city && touched.city}
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
                    hasError={errors.zipcode && touched.zipcode}
                    id="zipcode"
                    label="zipcode"
                    name="zipcode"
                    setFieldValue={setFieldValue}
                  />
                  <InputErrors
                    fieldErrors={errors.zipcode}
                    fieldTouched={touched.zipcode}
                  />
                </div>
              </div>
              {/* Timezone */}
              <div className="field relative">
                <div className="outline relative">
                  <Select
                    className=""
                    classNamePrefix="react-select-filter"
                    name="timezone"
                    options={timezonesOfSelectedCountry}
                    placeholder="Timezone"
                    styles={customStyles}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    value={
                      values.timezone.value
                        ? values.timezone
                        : timezonesOfSelectedCountry[0]
                    }
                    onChange={e => setFieldValue("timezone", e)}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.timezone && touched.timezone && (
                    <div>{errors.timezone.value}</div>
                  )}
                </div>
              </div>
              {/* Next Button */}
              <div className="mb-3">
                <button
                  disabled={isBtnDisabled(values)}
                  type="submit"
                  className={`form__button whitespace-nowrap tracking-normal ${
                    isBtnDisabled(values)
                      ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                      : "cursor-pointer"
                  }`}
                >
                  Next
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default CompanyDetailsForm;
