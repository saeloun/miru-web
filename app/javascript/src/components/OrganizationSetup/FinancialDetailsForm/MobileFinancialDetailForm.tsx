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

const MobileFinancialDetailForm = ({
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
      values.standard_rate >= 0 &&
      values.standard_rate != "" &&
      (typeof values.standard_rate == "number" ||
        !isNaN(Number(values.standard_rate)))
    );

  return (
    <div className="h-4/5">
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
            <Form className="flex h-full flex-col justify-between">
              <div>
                {/* Base Currency */}
                <div className="field relative">
                  <label className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300">
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
                    <SelectTrigger className="h-12">
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
                  <label className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300">
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
                    <SelectTrigger className="h-12">
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
                </div>
                {/* Date Format */}
                <div className="field relative">
                  <label className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300">
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
                    <SelectTrigger className="h-12">
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
                </div>
                {/* Save Org Details Button */}
              </div>
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

export default MobileFinancialDetailForm;
