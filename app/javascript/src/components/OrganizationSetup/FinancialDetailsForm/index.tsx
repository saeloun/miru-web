import React from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import Select, { components } from "react-select";

import {
  currencyListOptions,
  dateFormatOptions,
  financialDetailsFormInitialValues,
  financialDetailsFormValidationSchema,
  fiscalYearEndOptions,
} from "./utils";

interface FinancialDetailsFormValues {
  base_currency: string;
  standard_rate: number | string;
  year_end: string;
  date_format: string;
}

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

const FinancialDetailsForm = () => {
  const handleFinancialDetailsFormSubmit = (values: any) => {
    console.log(values); // eslint-disable-line
  };

  return (
    <div>
      <Formik
        initialValues={financialDetailsFormInitialValues}
        validateOnBlur={false}
        validationSchema={financialDetailsFormValidationSchema}
        onSubmit={handleFinancialDetailsFormSubmit}
      >
        {(props: FormikProps<FinancialDetailsFormValues>) => {
          const { touched, errors, setFieldValue } = props;

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
                    value={currencyListOptions[0]}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => setFieldValue("base_currency", e.value)}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.base_currency && touched.base_currency && (
                    <div>{errors.base_currency}</div>
                  )}
                </div>
              </div>
              {/* Standard Rate */}
              <div className="field relative">
                <div className="outline relative">
                  <Field
                    name="standard_rate"
                    placeholder=" "
                    type="number"
                    className={`form__input block h-12 w-full appearance-none bg-transparent p-4 text-base focus-within:border-miru-han-purple-1000 ${
                      errors.standard_rate &&
                      touched.standard_rate &&
                      "border-red-600 focus:border-red-600 focus:ring-red-600"
                    } `}
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
                    value={fiscalYearEndOptions[0]}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => setFieldValue("year_end", e.value)}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.year_end && touched.year_end && (
                    <div>{errors.year_end}</div>
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
                    value={dateFormatOptions[0]}
                    components={{
                      ValueContainer: CustomValueContainer,
                    }}
                    onChange={e => setFieldValue("date_format", e.value)}
                  />
                </div>
                <div className="mx-0 mt-1 mb-5 block text-xs tracking-wider text-red-600">
                  {errors.date_format && touched.date_format && (
                    <div>{errors.date_format}</div>
                  )}
                </div>
              </div>
              {/* Save Org Details Button */}
              <div className="mb-3">
                <button
                  className="form__button whitespace-nowrap"
                  data-cy="sign-up-button"
                  type="submit"
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
