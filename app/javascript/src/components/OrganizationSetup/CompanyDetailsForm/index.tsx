import React, { useEffect, useState } from "react";

import { Formik, Form, FormikProps } from "formik";
import { EditImageButtonSVG, deleteImageIcon } from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { Avatar } from "StyledComponents";
import worldCountries from "world-countries";
import { companyProfileApi } from "apis/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { InputErrors, InputField } from "common/FormikFields";

import { CompanyDetailsFormProps, CompanyDetailsFormValues } from "./interface";
import {
  companyDetailsFormInitialValues,
  companyDetailsFormValidationSchema,
} from "./utils";

import { i18n } from "../../../i18n";

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
  }, [allTimezones]);

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
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Business Phone
                </label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2">
                  <PhoneInput
                    className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                    flags={flags}
                    id="business_phone"
                    inputClassName="block w-full appearance-none bg-transparent border-0 focus:border-0 px-0 text-sm focus:ring-0 focus:outline-none"
                    name="business_phone"
                    value={values.business_phone}
                    onChange={phone => {
                      setFieldValue("business_phone", phone);
                    }}
                  />
                </div>
                <InputErrors
                  fieldErrors={errors.business_phone}
                  fieldTouched={touched.business_phone}
                />
              </div>
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
              {/* Country and State */}
              <div className="flex flex-row gap-4">
                <div className="mb-2 xsm:mb-6 flex w-1/2 flex-col" id="country">
                  <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                    Country
                  </label>
                  <Select
                    value={values.country?.value || ""}
                    onValueChange={value => {
                      const selectedCountry = countries.find(
                        c => c.value === value
                      );
                      if (selectedCountry) {
                        getTimezonesOfCurrentCountry(
                          selectedCountry.code,
                          setFieldValue
                        );
                        setFieldValue("country", selectedCountry);
                        setFieldValue("state", "");
                        setFieldValue("city", "");
                      }
                    }}
                  >
                    <SelectTrigger
                      data-testid="select-trigger"
                      className={`h-10 ${
                        errors.country ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem
                          key={country.value}
                          value={country.value}
                          data-testid="select-option"
                        >
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-1/2 flex-col" id="state">
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
              {/* City and Zipcode */}
              <div className="flex flex-row gap-4">
                <div className="flex w-1/2 flex-col" id="city">
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
                <div className="flex w-1/2 flex-col">
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
              {/* Timezone */}
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Timezone
                </label>
                <Select
                  value={
                    values.timezone?.value ||
                    timezonesOfSelectedCountry?.[0]?.value ||
                    ""
                  }
                  onValueChange={value => {
                    const selectedTimezone = timezonesOfSelectedCountry.find(
                      tz => tz.value === value
                    );
                    if (selectedTimezone) {
                      setFieldValue("timezone", selectedTimezone);
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.timezone ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezonesOfSelectedCountry?.map(timezone => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timezone && touched.timezone && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.timezone.value}
                  </div>
                )}
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
