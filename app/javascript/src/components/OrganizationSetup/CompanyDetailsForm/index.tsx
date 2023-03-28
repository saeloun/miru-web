import React, { useEffect, useState } from "react";

import { City, Country, State } from "country-state-city";
import { Formik, Form, FormikProps } from "formik";
import { DeleteImageButtonSVG, EditImageButtonSVG } from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import Select, { components } from "react-select";

import companyProfileApi from "apis/companyProfile";
import { CustomAsyncSelect } from "common/CustomAsyncSelect";
import CustomReactSelect from "common/CustomReactSelect";
import { InputErrors, InputField } from "common/FormikFields";

import { CompanyDetailsFormProps, CompanyDetailsFormValues } from "./interface";
import {
  companyDetailsFormInitialValues,
  companyDetailsFormValidationSchema,
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

  const initialSelectValue = {
    label: "",
    value: "",
    code: "",
  };
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
    getAllTimezones();
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

  useEffect(() => {
    if (Object.keys(allTimezones || {})?.length) {
      const selectedCountryCode = isFormAlreadySubmitted
        ? previousSubmittedValues.country?.value
        : companyDetailsFormInitialValues?.country?.code || "US";
      getTimezonesOfCurrentCountry(selectedCountryCode);
      updatedStates(selectedCountryCode);
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
      values.state?.value?.trim() &&
      values.city?.value?.trim() &&
      values.timezone?.value?.trim() &&
      values.address_line_1?.trim() &&
      values.business_phone?.trim() &&
      values.zipcode?.trim()
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
                <div className="flex flex-col">
                  <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white p-4 pt-2">
                    <PhoneInput
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                      flags={flags}
                      id="business_phone"
                      inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none "
                      name="business_phone"
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
              <div className="field relative">
                <InputField
                  id="address_line_1"
                  label="Address line 1"
                  name="address_line_1"
                  resetErrorOnChange={false}
                />
                <InputErrors
                  fieldErrors={errors.address_line_1}
                  fieldTouched={touched.address_line_1}
                />
              </div>
              <div className="field relative mb-5">
                <InputField
                  id="address_line_2"
                  label="Address line 2 (optional)"
                  name="address_line_2"
                  resetErrorOnChange={false}
                />
              </div>
              {/* Country */}
              <div className="mb-5 flex flex-row">
                <div className="flex w-1/2 flex-col py-0 pr-2">
                  <CustomReactSelect
                    isErr={!!errors.country}
                    label="Country"
                    name="country"
                    options={countries}
                    value={values.country.value ? values.country : null}
                    handleOnChange={e => {
                      setCurrentCountryDetails(e);
                      getTimezonesOfCurrentCountry(e.code, setFieldValue);
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
