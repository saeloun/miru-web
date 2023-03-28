import React from "react";

import {
  CalendarIcon,
  InfoIcon,
  MapPinIcon,
  MoneyIcon,
  PhoneIcon,
} from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

import { CustomAsyncSelect } from "common/CustomAsyncSelect";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";

import FileAcceptanceText from "./FileAcceptanceText";
import { ProfileImage } from "./ProfileImage";
import { Uploader } from "./Uploader";

const inputClass =
  "form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000";

const labelClass =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300";

export const StaticPage = ({
  orgDetails,
  isDragActive,
  getInputProps,
  getRootProps,
  handleDeleteLogo,
  onLogoChange,
  errDetails,
  handleChangeCompanyDetails,
  handleAddrChange,
  handleOnChangeCountry,
  countries,
  handleOnChangeState,
  stateList,
  handleOnChangeCity,
  promiseOptions,
  handleZipcodeChange,
  handleCurrencyChange,
  currenciesOption,
  handleTimezoneChange,
  timezoneOption,
  handleDateFormatChange,
  dateFormatOptions,
  handleFiscalYearChange,
  fiscalYearOptions,
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <InfoIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Basic Details
        </span>
      </div>
      <div className="flex w-72 flex-col">
        <div className="flex flex-row items-center px-2 pb-4 text-center">
          {!orgDetails.logoUrl ? (
            <Uploader
              getInputProps={getInputProps}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
            />
          ) : (
            <ProfileImage
              handleDeleteLogo={handleDeleteLogo}
              src={orgDetails.logoUrl}
              onLogoChange={onLogoChange}
            />
          )}
          <div className="ml-5 w-36 whitespace-pre-wrap text-left text-xs	 text-miru-dark-purple-400 ">
            <FileAcceptanceText />
          </div>
        </div>
        <div className="flex w-1/2 flex-col px-2 pt-1">
          <CustomInputText
            dataCy="company-name"
            id="companyName"
            label="Company Name"
            name="companyName"
            type="text"
            value={orgDetails.companyName}
            inputBoxClassName={`${inputClass} ${
              errDetails.companyNameErr
                ? "border-red-600"
                : "border-miru-gray-1000"
            }`}
            labelClassName={`${labelClass} ${
              errDetails.companyNameErr
                ? "text-red-600"
                : "text-miru-dark-purple-200"
            }`}
            onChange={e =>
              handleChangeCompanyDetails(e.target.value, "companyName")
            }
          />
          {errDetails.companyNameErr && (
            <ErrorSpan
              className="text-xs text-red-600"
              message={errDetails.companyNameErr}
            />
          )}
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18 ">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <PhoneIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Contact Details
        </span>
      </div>
      <div className="w-72">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white px-4 py-2.5">
              <PhoneInput
                className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                defaultCountry="US"
                flags={flags}
                initialValueFormat="national"
                inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none "
                value={orgDetails.companyPhone ? orgDetails.companyPhone : ""}
                onChange={e => handleChangeCompanyDetails(e, "companyPhone")}
              />
              <label
                className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300"
                htmlFor="phone_number"
              >
                Phone number
              </label>
            </div>
            {errDetails.companyNameErr && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.companyPhoneErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <MapPinIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Address
        </span>
      </div>
      <div className="w-72">
        <div className="flex w-full flex-col px-2 pb-3">
          <CustomInputText
            dataCy="address-line-1"
            id="addressLine1"
            label="Address line 1"
            name="addressLine1"
            type="text"
            value={orgDetails.companyAddr.addressLine1}
            onChange={e => handleAddrChange(e, "addressLine1")}
          />
          {errDetails.addressLine1Err && (
            <ErrorSpan
              className="text-xs text-red-600"
              message={errDetails.addressLine1Err}
            />
          )}
        </div>
        <div className="flex w-full flex-col px-2 py-3">
          <CustomInputText
            dataCy="address-line-2"
            id="addressLine2"
            label="Address line 2 (optional)"
            name="addressLine2"
            type="text"
            value={orgDetails.companyAddr.addressLine2}
            onChange={e => handleAddrChange(e, "addressLine2")}
          />
        </div>
        <div className="flex flex-row pt-2 pb-1">
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomReactSelect
              handleOnChange={value => handleOnChangeCountry(value)}
              label="Country"
              name="countrySelect"
              options={countries}
              value={orgDetails.companyAddr.country}
            />
            {errDetails.countryErr && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.countryErr}
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomReactSelect
              handleOnChange={state => handleOnChangeState(state)}
              label="State"
              name="stateSelect"
              options={stateList}
              value={
                orgDetails.companyAddr.state
                  ? {
                      label: orgDetails.companyAddr.state.label,
                      value: orgDetails.companyAddr.state.value,
                    }
                  : null
              }
            />
            {errDetails.stateErr && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.stateErr}
              />
            )}
          </div>
        </div>
        <div className="flex flex-row py-1">
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomAsyncSelect
              handleOnChange={city => handleOnChangeCity(city)}
              isErr={false}
              label="City"
              loadOptions={inputVal => promiseOptions(inputVal)}
              name="citySelect"
              value={{
                label: orgDetails.companyAddr.city.label,
                value: orgDetails.companyAddr.city.value,
              }}
            />
            {errDetails.cityErr && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.cityErr}
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomInputText
              dataCy="zipcode"
              id="zipcode"
              label="Zipcode"
              name="zipcode"
              type="text"
              value={orgDetails.companyAddr.zipcode}
              onChange={e => {
                handleZipcodeChange(e, "zipcode");
              }}
            />
            {errDetails.zipcodeErr && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.zipcodeErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-row  border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <span className="mr-2 w-13">
            <MoneyIcon color="#1D1A31" size={13.5} weight="bold" />
          </span>
          Currency and Standard Rate
        </span>
      </div>
      <div className="w-72">
        <div className="flex flex-row">
          <div className="w-1/2 p-2" data-cy="base-currency">
            <CustomReactSelect
              classNamePrefix="react-select-filter"
              handleOnChange={handleCurrencyChange}
              label="Base Currency"
              name="baseCurrency"
              options={currenciesOption}
              value={
                orgDetails.companyCurrency
                  ? currenciesOption.find(
                      o => o.value === orgDetails.companyCurrency
                    )
                  : { label: "US Dollar ($)", value: "USD" }
              }
            />
          </div>
          <div className="w-1/2 p-2">
            <CustomInputText
              dataCy="standard-rate"
              id="company_rate"
              label="Standard Rate"
              min={0.0}
              name="companyRate"
              step="0.01"
              type="number"
              value={orgDetails.companyRate}
              inputBoxClassName={`${inputClass} ${
                errDetails.companyNameErr
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.companyNameErr
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
              onChange={e =>
                handleChangeCompanyDetails(e.target.value, "companyRate")
              }
            />
            {errDetails.companyRateErr && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.companyRateErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-row  border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <CalendarIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Date & Time
        </span>
      </div>
      <div className="w-72">
        <div className="flex flex-row ">
          <div className="w-1/2 p-2" data-cy="timezone">
            <CustomReactSelect
              classNamePrefix="react-select-filter"
              handleOnChange={handleTimezoneChange}
              label="Timezone"
              name="timezone"
              options={timezoneOption}
              value={
                orgDetails.companyTimezone
                  ? timezoneOption.find(
                      o => o.value === orgDetails.companyTimezone
                    )
                  : timezoneOption[0]
              }
            />
          </div>
          <div className="w-1/2 p-2" data-cy="date-format">
            <CustomReactSelect
              classNamePrefix="react-select-filter"
              handleOnChange={handleDateFormatChange}
              label="Date Format"
              name="date_format"
              options={dateFormatOptions}
              value={
                orgDetails.companyDateFormat
                  ? dateFormatOptions.find(
                      o => o.value === orgDetails.companyDateFormat
                    )
                  : dateFormatOptions[1]
              }
            />
          </div>
        </div>
        <div className="flex w-1/2 flex-col px-2 pt-3" data-cy="fiscal-year">
          <CustomReactSelect
            classNamePrefix="react-select-filter"
            handleOnChange={handleFiscalYearChange}
            label="Fiscal Year End"
            name="fiscal_year_end"
            options={fiscalYearOptions}
            value={
              orgDetails.companyFiscalYear
                ? fiscalYearOptions.find(
                    o => o.value === orgDetails.companyFiscalYear
                  )
                : fiscalYearOptions[0]
            }
          />
        </div>
      </div>
    </div>
  </div>
);
