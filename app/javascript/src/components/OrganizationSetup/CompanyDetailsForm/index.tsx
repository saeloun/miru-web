import React, { useEffect, useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { DeleteIcon, EditImageButtonSVG } from "miruIcons";
import Select, { components } from "react-select";

import { registerIntercepts, setAuthHeaders } from "apis/axios";
import companyProfileApi from "apis/companyProfile";

import {
  companyDetailsFormInitialValues,
  companyDetailsFormValidationSchema,
  groupedCountryListOptions,
  mostSelectedCountries,
} from "./utils";

interface CompanyDetailsFormValues {
  company: string;
  business_phone: string;
  address: string;
  country: string;
  timezone: string;
  logo_url: string | null;
}
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

const CompanyDetailsForm = () => {
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
        companyDetailsFormInitialValues?.country || "US";
      getTimezonesOfCurrentCountry(defaultSelectedCountryCode);
    }
  }, [allTimezones]);

  const getAllTimezones = async () => {
    const res = await companyProfileApi.get();
    const tempAllTimezones = res?.data?.timezones || [];
    setAllTimezones(tempAllTimezones);
  };

  const getTimezonesOfCurrentCountry = (countryCode: string) => {
    const timezoneOfSelectedCountry = allTimezones[countryCode];
    const formattedTimeZoneOptions = timezoneOfSelectedCountry?.map(
      timezone => ({ value: timezone, label: timezone })
    );
    setTimezonesOfSelectedCountry(formattedTimeZoneOptions);
  };

  const onLogoChange = (e, setFieldValue) => {
    const file = e.target.files[0];
    const logoUrl = URL.createObjectURL(file);
    setFieldValue("logo_url", logoUrl);
  };

  const handleCompanyDetailsFormSubmit = (values: any) => {
    console.log(values); // eslint-disable-line
  };

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
                {values.logo_url ? (
                  <div className="mx-auto mt-2 flex flex-row items-center justify-center">
                    <div className="h-20 w-20">
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
                        style={{ minWidth: "40px" }}
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
                        style={{ minWidth: "40px" }}
                        onClick={() => setFieldValue("logo_url", null)}
                      />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto mt-2 h-20 w-20 rounded-full border border-dotted border-miru-dark-purple-200">
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
                    name="company"
                    placeholder=" "
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.company &&
                      touched.company &&
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
                  {errors.company && touched.company && (
                    <div>{errors.company}</div>
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
                    value={mostSelectedCountries[0]}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => {
                      getTimezonesOfCurrentCountry(e.value);

                      return setFieldValue("country", e.value);
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
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    value={
                      timezonesOfSelectedCountry?.length
                        ? timezonesOfSelectedCountry[0]
                        : []
                    }
                    onChange={e => setFieldValue("timezone", e.value)}
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
                  className="form__button whitespace-nowrap"
                  data-cy="sign-up-button"
                  type="submit"
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
