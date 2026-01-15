import React from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import Select, { components } from "react-select";

import {
  FinancialDetailsFormProps,
  FinancialDetailsFormValues,
} from "./interface";
import {
  currencyListOptions,
  dateFormatOptions,
  financialDetailsFormInitialValues,
  financialDetailsFormValidationSchema,
  fiscalYearEndOptions,
} from "./utils";

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

const { ValueContainer, Placeholder } = components;

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

const FinancialDetailsForm = ({
  onSaveBtnClick,
  setFinancialDetails,
  isUpdatedFormValues,
  prevFormValues,
}: FinancialDetailsFormProps) => {
  const handleFormFieldValueChange = (fieldName: string, value: any) => {
    setFinancialDetails(prevFormValues => ({
      ...prevFormValues,
      [fieldName]: value,
    }));
  };

  const isBtnDisabled = (values: FinancialDetailsFormValues) =>
    !(
      values.base_currency?.value?.trim() &&
      values.year_end?.value?.trim() &&
      values.date_format?.value?.trim() &&
      values.working_days != "" &&
      values.working_hours != "" &&
      (typeof values.standard_rate == "number"
        ? values.standard_rate >= 0
        : values.standard_rate != "") &&
      (typeof values.standard_rate == "number" ||
        !isNaN(Number(values.standard_rate)))
    );

  return (
    <div>
      <Formik
        validateOnBlur={false}
        validationSchema={financialDetailsFormValidationSchema}
        initialValues={
          isUpdatedFormValues
            ? prevFormValues
            : financialDetailsFormInitialValues
        }
        onSubmit={onSaveBtnClick}
      >
        {(props: FormikProps<FinancialDetailsFormValues>) => {
          const { touched, errors, setFieldValue, values } = props;

          return (
            <Form>
              {/* Base Currency */}
              <div className="field relative">
                <div className="outline relative">
                  <Select
                    className=""
                    classNamePrefix="react-select-filter"
                    name="base_currency"
                    options={currencyListOptions}
                    placeholder="Base Currency"
                    styles={customStyles}
                    value={values.base_currency}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => {
                      setFieldValue("base_currency", e);
                      handleFormFieldValueChange("base_currency", e);
                    }}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.base_currency && touched.base_currency && (
                    <div>{errors.base_currency.value}</div>
                  )}
                </div>
              </div>
              {/* Standard Rate */}
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    name="standard_rate"
                    placeholder=" "
                    step="0.01"
                    type="number"
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.standard_rate &&
                      touched.standard_rate &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                    onChange={e => {
                      setFieldValue("standard_rate", e.target.value);
                      handleFormFieldValueChange(
                        "standard_rate",
                        Number(e.target.value)
                      );
                    }}
                  />
                  <label
                    className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="standard_rate"
                  >
                    Standard Rate (per hour)
                  </label>
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.standard_rate && touched.standard_rate && (
                    <div>{errors.standard_rate}</div>
                  )}
                </div>
              </div>
              {/* Fiscal Year End  */}
              <div className="field relative">
                <div className="outline relative">
                  <Select
                    className=""
                    classNamePrefix="react-select-filter"
                    name="year_end"
                    options={fiscalYearEndOptions}
                    placeholder="Fiscal Year End"
                    styles={customStyles}
                    value={values.year_end}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => {
                      setFieldValue("year_end", e);
                      handleFormFieldValueChange("year_end", e);
                    }}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.year_end && touched.year_end && (
                    <div>{errors.year_end.value}</div>
                  )}
                </div>
              </div>
              {/* Date Format */}
              <div className="field relative">
                <div className="outline relative">
                  <Select
                    className=""
                    classNamePrefix="react-select-filter"
                    name="date_format"
                    options={dateFormatOptions}
                    placeholder="Date Format"
                    styles={customStyles}
                    value={values.date_format}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => {
                      setFieldValue("date_format", e);
                      handleFormFieldValueChange("date_format", e);
                    }}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.date_format && touched.date_format && (
                    <div>{errors.date_format.value}</div>
                  )}
                </div>
              </div>
              {/* working hours and days */}
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    name="working_days"
                    placeholder=" "
                    step="0.01"
                    type="text"
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.working_days &&
                      touched.working_days &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                    onChange={e => {
                      setFieldValue("working_days", e.target.value);
                      handleFormFieldValueChange(
                        "working_days",
                        e.target.value
                      );
                    }}
                  />
                  <label
                    className="absolute top-3 z-1 origin-0 bg-white px-1 text-sm font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="working_days"
                  >
                    Working Days (per week)
                  </label>
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.working_days && touched.working_days && (
                    <div>{errors.working_days}</div>
                  )}
                </div>
              </div>
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    name="working_hours"
                    placeholder=" "
                    step="0.01"
                    type="text"
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.working_hours &&
                      touched.working_hours &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
                    onChange={e => {
                      setFieldValue("working_hours", e.target.value);
                      handleFormFieldValueChange(
                        "working_hours",
                        e.target.value
                      );
                    }}
                  />
                  <label
                    className="absolute top-3 z-1 origin-0 bg-white px-1 text-sm font-medium text-miru-dark-purple-200 duration-300"
                    htmlFor="working_hours"
                  >
                    Working Hours (per week)
                  </label>
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.working_hours && touched.working_hours && (
                    <div>{errors.working_hours}</div>
                  )}
                </div>
              </div>
              {/* Save Org Details Button */}
              <div className="mb-3">
                <button
                  type="submit"
                  className={`form__button whitespace-nowrap tracking-normal ${
                    isBtnDisabled(values)
                      ? "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
                      : "cursor-pointer"
                  }`}
                >
                  Save Org Details
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default FinancialDetailsForm;
