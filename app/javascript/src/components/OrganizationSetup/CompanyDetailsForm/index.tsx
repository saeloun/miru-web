import React, { useEffect, useState } from "react";

import { Formik, Form, FormikProps } from "formik";
import { DeleteImageButtonSVG, EditImageButtonSVG } from "miruIcons";
import Select, { components } from "react-select";

import companyProfileApi from "apis/companyProfile";
import { InputErrors, InputField } from "common/FormikFields";

import { CompanyDetailsFormProps, CompanyDetailsFormValues } from "./interface";
import {
  companyDetailsFormInitialValues,
  companyDetailsFormValidationSchema,
  groupedCountryListOptions,
} from "./utils";

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

const groupStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const formatGroupLabel = (data: any) => (
  <div style={groupStyles}>
    <span>{data.label}</span>
  </div>
);

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
}: CompanyDetailsFormProps) => {
  const [allTimezones, setAllTimezones] = useState({});
  const [timezonesOfSelectedCountry, setTimezonesOfSelectedCountry] = useState(
    []
  );

  useEffect(() => {
    getAllTimezones();
  }, []);

  useEffect(() => {
    if (Object.keys(allTimezones || {})?.length) {
      const selectedCountryCode = isFormAlreadySubmitted
        ? previousSubmittedValues.country?.value
        : companyDetailsFormInitialValues?.country?.value || "US";
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
    setFieldValue("logo_url", logoUrl);
    setFieldValue("logo", file);
  };

  const isBtnDisabled = (values: CompanyDetailsFormValues) =>
    !(
      values.country?.value?.trim() &&
      values.timezone?.value?.trim() &&
      values.address?.trim() &&
      values.business_phone?.trim()
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
              <div className="my-6 mx-auto w-full">
                {values?.logo_url ? (
                  <div className="mx-auto mt-2 ml-16 flex flex-row items-center justify-center">
                    <div className="mr-5 h-16 w-16">
                      <img
                        alt="org_logo"
                        className="h-full min-w-full rounded-full object-cover"
                        src={values.logo_url}
                      />
                    </div>
                    <label htmlFor="file-input">
                      <img
                        alt="edit"
                        className="min-w-12 cursor-pointer rounded-full hover:bg-miru-gray-50"
                        src={EditImageButtonSVG}
                      />
                    </label>
                    <input
                      className="hidden"
                      id="file-input"
                      name="myImage"
                      type="file"
                      onChange={e => onLogoChange(e, setFieldValue)}
                    />
                    <button
                      data-cy="delete-logo"
                      onClick={() => setFieldValue("logo_url", null)}
                    >
                      <img
                        alt="edit"
                        className="min-w-12 cursor-pointer rounded-full hover:bg-miru-gray-50"
                        src={DeleteImageButtonSVG}
                      />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mt-2 h-16 w-16 rounded-full border border-dashed border-miru-dark-purple-200 hover:bg-miru-gray-50">
                      <label
                        className="flex h-full w-full cursor-pointer items-center justify-center rounded-full px-1 py-2 text-center text-xs text-miru-dark-purple-200"
                        htmlFor="file-input"
                      >
                        Add company logo
                      </label>
                    </div>
                    <input
                      className="hidden"
                      id="file-input"
                      name="myImage"
                      type="file"
                      onChange={e => onLogoChange(e, setFieldValue)}
                    />
                  </>
                )}
              </div>
              <div className="field relative">
                <InputField
                  autoFocus
                  id="company_name"
                  label="Company Name"
                  name="company_name"
                  resetErrorOnChange={false}
                />
                <InputErrors
                  fieldErrors={errors.company_name}
                  fieldTouched={touched.company_name}
                />
              </div>
              <div className="field relative">
                <InputField
                  id="business_phone"
                  label="Business Phone"
                  name="business_phone"
                  resetErrorOnChange={false}
                />
                <InputErrors
                  fieldErrors={errors.business_phone}
                  fieldTouched={touched.business_phone}
                />
              </div>
              <div className="field relative">
                <InputField
                  id="address"
                  label="Address"
                  name="address"
                  resetErrorOnChange={false}
                />
                <InputErrors
                  fieldErrors={errors.address}
                  fieldTouched={touched.address}
                />
              </div>
              {/* Country */}
              <div className="field relative">
                <div className="outline relative">
                  <Select
                    className=""
                    classNamePrefix="react-select-filter"
                    formatGroupLabel={formatGroupLabel}
                    name="country"
                    options={groupedCountryListOptions}
                    placeholder="Country"
                    styles={customStyles}
                    value={values.country}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => {
                      getTimezonesOfCurrentCountry(e.value, setFieldValue);
                      setFieldValue("country", e);
                    }}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.country && touched.country && (
                    <div>{errors.country}</div>
                  )}
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
                    value={values.timezone}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => setFieldValue("timezone", e)}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.timezone && touched.timezone && (
                    <div>{errors.timezone}</div>
                  )}
                </div>
              </div>
              {/* Next Button */}
              <div className="mb-3">
                <button
                  data-cy="sign-up-button"
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
