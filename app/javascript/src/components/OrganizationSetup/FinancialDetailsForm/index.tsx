import React from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

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
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Base Currency
                </label>
                <Select
                  value={values.base_currency?.value || ""}
                  onValueChange={value => {
                    const selectedCurrency = currencyListOptions.find(
                      c => c.value === value
                    );
                    if (selectedCurrency) {
                      setFieldValue("base_currency", selectedCurrency);
                      handleFormFieldValueChange(
                        "base_currency",
                        selectedCurrency
                      );
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.base_currency ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select base currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyListOptions.map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.base_currency && touched.base_currency && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.base_currency.value}
                  </div>
                )}
              </div>

              {/* Standard Rate */}
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Standard Rate (per hour)
                </label>
                <Field
                  name="standard_rate"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    errors.standard_rate && touched.standard_rate
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={e => {
                    setFieldValue("standard_rate", e.target.value);
                    handleFormFieldValueChange(
                      "standard_rate",
                      Number(e.target.value)
                    );
                  }}
                />
                {errors.standard_rate && touched.standard_rate && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.standard_rate}
                  </div>
                )}
              </div>

              {/* Fiscal Year End */}
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Fiscal Year End
                </label>
                <Select
                  value={values.year_end?.value || ""}
                  onValueChange={value => {
                    const selectedYearEnd = fiscalYearEndOptions.find(
                      y => y.value === value
                    );
                    if (selectedYearEnd) {
                      setFieldValue("year_end", selectedYearEnd);
                      handleFormFieldValueChange("year_end", selectedYearEnd);
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.year_end ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select fiscal year end" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYearEndOptions.map(yearEnd => (
                      <SelectItem key={yearEnd.value} value={yearEnd.value}>
                        {yearEnd.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year_end && touched.year_end && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.year_end.value}
                  </div>
                )}
              </div>

              {/* Date Format */}
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Date Format
                </label>
                <Select
                  value={values.date_format?.value || ""}
                  onValueChange={value => {
                    const selectedDateFormat = dateFormatOptions.find(
                      d => d.value === value
                    );
                    if (selectedDateFormat) {
                      setFieldValue("date_format", selectedDateFormat);
                      handleFormFieldValueChange(
                        "date_format",
                        selectedDateFormat
                      );
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.date_format ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormatOptions.map(dateFormat => (
                      <SelectItem
                        key={dateFormat.value}
                        value={dateFormat.value}
                      >
                        {dateFormat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.date_format && touched.date_format && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.date_format.value}
                  </div>
                )}
              </div>

              {/* Working Days */}
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Working Days (per week)
                </label>
                <Field
                  name="working_days"
                  placeholder="5"
                  type="text"
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    errors.working_days && touched.working_days
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={e => {
                    setFieldValue("working_days", e.target.value);
                    handleFormFieldValueChange("working_days", e.target.value);
                  }}
                />
                {errors.working_days && touched.working_days && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.working_days}
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className="mb-2 xsm:mb-6">
                <label className="mb-2 block text-sm font-medium text-miru-dark-purple-400">
                  Working Hours (per week)
                </label>
                <Field
                  name="working_hours"
                  placeholder="40"
                  type="text"
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    errors.working_hours && touched.working_hours
                      ? "border-red-500"
                      : ""
                  }`}
                  onChange={e => {
                    setFieldValue("working_hours", e.target.value);
                    handleFormFieldValueChange("working_hours", e.target.value);
                  }}
                />
                {errors.working_hours && touched.working_hours && (
                  <div className="mt-1 text-xs tracking-wider text-red-600">
                    {errors.working_hours}
                  </div>
                )}
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
