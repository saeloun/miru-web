import React, { useEffect, useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { DeleteIcon, EditImageButtonSVG } from "miruIcons";
import Select, { components } from "react-select";

import { registerIntercepts, setAuthHeaders } from "apis/axios";
import companyProfileApi from "apis/companyProfile";

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
    minHeight: 32,
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
    top: "-30%",
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

const CompanyDetailsForm = ({ onNextBtnClick }: CompanyDetailsFormProps) => {
  const [allTimezones, setAllTimezones] = useState({});
  const [timezonesOfSelectedCountry, setTimezonesOfSelectedCountry] = useState(
    []
  );

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    getAllTimezones();
  }, []);

  useEffect(() => {
    if (Object.keys(allTimezones || {})?.length) {
      const defaultSelectedCountryCode =
        companyDetailsFormInitialValues?.country?.value || "US";
      getTimezonesOfCurrentCountry(defaultSelectedCountryCode);
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
    setFieldValue("logo_url", logoUrl);
    setFieldValue("logo", file);
  };

  const handleCompanyDetailsFormSubmit = (values: CompanyDetailsFormValues) => {
    const formattedCompanyDetails = {
      ...values,
      country: values.country?.value || "",
      timezone: values.timezone?.value || "",
    };
    onNextBtnClick(formattedCompanyDetails);
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
        initialValues={companyDetailsFormInitialValues}
        validateOnBlur={false}
        validationSchema={companyDetailsFormValidationSchema}
        onSubmit={handleCompanyDetailsFormSubmit}
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
                        className="h-full min-w-full rounded-full object-contain"
                        src={values.logo_url}
                      />
                    </div>
                    <label htmlFor="file-input">
                      <img
                        alt="edit"
                        className="cursor-pointer rounded-full"
                        src={EditImageButtonSVG}
                        style={{ minWidth: "12px" }}
                      />
                    </label>
                    <input
                      className="hidden"
                      id="file-input"
                      name="myImage"
                      type="file"
                      onChange={e => onLogoChange(e, setFieldValue)}
                    />
                    <button data-cy="delete-logo">
                      <DeleteIcon
                        className="ml-2 cursor-pointer rounded-full"
                        style={{ minWidth: "12px", color: "#5B34EA" }}
                        onClick={() => setFieldValue("logo_url", null)}
                      />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mt-2 h-16 w-16 rounded-full border border-dashed border-miru-dark-purple-200">
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
              {/* Company Name */}
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    autoFocus
                    name="company_name"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.company_name &&
                      touched.company_name &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="name"
                  >
                    Company Name
                  </label>
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.company_name && touched.company_name && (
                    <div>{errors.company_name}</div>
                  )}
                </div>
              </div>
              {/* Business Phone */}
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    name="business_phone"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.business_phone &&
                      touched.business_phone &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="business_phone"
                  >
                    Business Phone
                  </label>
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.business_phone && touched.business_phone && (
                    <div>{errors.business_phone}</div>
                  )}
                </div>
              </div>
              {/* Address */}
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    name="address"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.address &&
                      touched.address &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="address"
                  >
                    Address
                  </label>
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.address && touched.address && (
                    <div>{errors.address}</div>
                  )}
                </div>
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
                  className={`form__button whitespace-nowrap ${
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
