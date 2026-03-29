import React from "react";

import {
  CalendarIcon,
  InfoIcon,
  MapPinIcon,
  MoneyIcon,
  PhoneIcon,
  ClockIcon,
} from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import { ErrorSpan } from "common/ErrorSpan";

import FileAcceptanceText from "./FileAcceptanceText";
import { ProfileImage } from "./ProfileImage";
import { Uploader } from "./Uploader";

const inputClass =
  "form__input block h-10 w-full appearance-none bg-background p-4 text-sm font-medium text-foreground focus-within:border-primary md:h-12 md:text-base";

const labelClass =
  "absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-base font-medium duration-300";

export const StaticPage = ({
  orgDetails: {
    companyAddr,
    logoUrl,
    companyName,
    companyPhone,
    companyCurrency,
    companyRate,
    companyTimezone,
    companyDateFormat,
    companyFiscalYear,
    companyWorkingDays,
    companyWorkingHours,
  },
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
  handleZipcodeChange,
  handleStateChange,
  handleCityChange,
  handleCurrencyChange,
  currenciesOption,
  handleTimezoneChange,
  timezoneOption,
  handleDateFormatChange,
  dateFormatOptions,
  handleFiscalYearChange,
  fiscalYearOptions,
  cancelAction,
  saveAction,
}) => (
  <div className="mt-4 h-full bg-muted px-4 md:px-10">
    <div className="flex flex-col gap-y-6 border-b border-b-border py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-foreground">
          <InfoIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          <p>Basic Details</p>
        </div>
      </div>
      <div className="flex w-full flex-col md:w-72">
        <div className="flex flex-row items-center px-2 pb-6 text-center">
          {!logoUrl ? (
            <Uploader
              getInputProps={getInputProps}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
            />
          ) : (
            <ProfileImage
              handleDeleteLogo={handleDeleteLogo}
              src={logoUrl}
              onLogoChange={onLogoChange}
            />
          )}
          <div className="ml-5 whitespace-pre-wrap text-left text-xs font-normal text-muted-foreground md:w-44 lg:w-36">
            <FileAcceptanceText />
          </div>
        </div>
        <div className="flex w-full flex-col px-2 pt-1 md:w-1/2">
          <CustomInputText
            id="companyName"
            label="Company Name"
            name="companyName"
            type="text"
            value={companyName}
            inputBoxClassName={`${inputClass} ${
              errDetails.companyNameErr ? "border-destructive" : "border-border"
            }`}
            labelClassName={`${labelClass} ${
              errDetails.companyNameErr
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
            onChange={e =>
              handleChangeCompanyDetails(e.target.value, "companyName")
            }
          />
          {errDetails.companyNameErr && (
            <ErrorSpan
              className="text-xs text-destructive"
              message={errDetails.companyNameErr}
            />
          )}
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-border py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-foreground">
          <PhoneIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          <p>Contact Details</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="flex flex-row">
          <div className="flex w-full flex-col px-2 md:w-1/2">
            <div className="outline relative flex h-12 flex-row rounded border border-border bg-background px-4 md:py-2.5">
              <PhoneInput
                className="input-phone-number w-full border-transparent text-sm font-medium focus:border-transparent focus:ring-0"
                defaultCountry="US"
                flags={flags}
                initialValueFormat="national"
                value={companyPhone || ""}
                onChange={e => handleChangeCompanyDetails(e, "companyPhone")}
              />
              <label
                className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-background px-1 text-xsm font-medium text-muted-foreground duration-300"
                htmlFor="phone_number"
              >
                Phone number
              </label>
            </div>
            {errDetails.companyPhoneErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.companyPhoneErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-border py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-foreground">
          <MapPinIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          <p>Address</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="flex w-full flex-col px-2 pb-3 text-sm font-medium">
          <CustomTextareaAutosize
            id="addressLine1"
            label="Address line 1"
            maxRows={5}
            name="addressLine1"
            rows={1}
            value={companyAddr.addressLine1}
            onChange={e => handleAddrChange(e, "addressLine1")}
          />
          {errDetails.addressLine1Err && (
            <ErrorSpan
              className="text-xs text-destructive"
              message={errDetails.addressLine1Err}
            />
          )}
        </div>
        <div className="flex w-full flex-col px-2 py-3">
          <CustomTextareaAutosize
            id="addressLine2"
            label="Address line 2 (optional)"
            maxRows={5}
            name="addressLine2"
            rows={1}
            value={companyAddr.addressLine2}
            onChange={e => handleAddrChange(e, "addressLine2")}
          />
          {errDetails.addressLine2Err && (
            <ErrorSpan
              className="text-xs text-destructive"
              message={errDetails.addressLine2Err}
            />
          )}
        </div>
        <div className="flex flex-row pt-2 pb-1">
          <div className="flex w-1/2 flex-col px-2 pb-3 text-sm font-medium">
            <CustomReactSelect
              handleOnChange={value => handleOnChangeCountry(value)}
              label="Country"
              name="countrySelect"
              options={countries}
              value={companyAddr.country}
            />
            {errDetails.countryErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.countryErr}
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col px-2 pb-3 text-sm font-medium">
            <CustomInputText
              id="state"
              label="State"
              name="state"
              type="text"
              value={companyAddr.state}
              onChange={e => {
                handleStateChange(e);
              }}
            />
            {errDetails.stateErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.stateErr}
              />
            )}
          </div>
        </div>
        <div className="flex flex-row py-1">
          <div
            className="flex w-1/2 flex-col px-2 pb-3 text-sm font-medium"
            id="citySelect"
          >
            <CustomInputText
              id="city"
              label="City"
              name="city"
              type="text"
              value={companyAddr.city}
              onChange={e => {
                handleCityChange(e);
              }}
            />
            {errDetails.cityErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.cityErr}
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col px-2 pb-3 text-sm font-medium">
            <CustomInputText
              id="zipcode"
              label="Zipcode"
              name="zipcode"
              type="text"
              value={companyAddr.zipcode}
              onChange={e => {
                handleZipcodeChange(e);
              }}
            />
            {errDetails.zipcodeErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.zipcodeErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-border py-6 md:flex-row md:py-8">
      <div className="w-full md:w-18">
        <span className="flex flex-row items-center text-sm font-medium text-foreground">
          <span className="mr-2 w-13">
            <MoneyIcon color="#1D1A31" size={13.5} weight="bold" />
          </span>
          Currency and Standard Rate
        </span>
      </div>
      <div className="w-full md:w-72">
        <div className="flex flex-row text-sm font-medium">
          <div className="w-1/2 p-2" data-cy="base-currency">
            <CustomReactSelect
              classNamePrefix="react-select-filter"
              handleOnChange={handleCurrencyChange}
              label="Base Currency"
              name="baseCurrency"
              options={currenciesOption}
              value={
                companyCurrency
                  ? currenciesOption.find(o => o.value === companyCurrency)
                  : { label: "US Dollar ($)", value: "USD" }
              }
            />
          </div>
          <div className="w-1/2 p-2 text-sm font-medium">
            <CustomInputText
              id="company_rate"
              label="Standard Rate"
              min={0.0}
              name="companyRate"
              step="0.01"
              type="number"
              value={companyRate}
              inputBoxClassName={`${inputClass} ${
                errDetails.companyNameErr
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.companyNameErr
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e =>
                handleChangeCompanyDetails(e.target.value, "companyRate")
              }
            />
            {errDetails.companyRateErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.companyRateErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-border py-6 md:flex-row md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-foreground">
          <CalendarIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          <p>Date & Time</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="w-full p-2 pb-6 text-sm font-medium" data-cy="timezone">
          <CustomReactSelect
            classNamePrefix="react-select-filter"
            handleOnChange={handleTimezoneChange}
            label="Timezone"
            name="timezone"
            options={timezoneOption}
            value={
              companyTimezone
                ? timezoneOption.find(o => o.value === companyTimezone)
                : timezoneOption[0]
            }
          />
        </div>
        <div className="flex flex-row items-center justify-center">
          <div className="w-1/2 p-2 text-sm font-medium" data-cy="date-format">
            <CustomReactSelect
              classNamePrefix="react-select-filter"
              handleOnChange={handleDateFormatChange}
              label="Date Format"
              name="date_format"
              options={dateFormatOptions}
              value={
                companyDateFormat
                  ? dateFormatOptions.find(o => o.value === companyDateFormat)
                  : dateFormatOptions[1]
              }
            />
          </div>
          <div className="w-1/2 p-2 text-sm font-medium" data-cy="fiscal-year">
            <CustomReactSelect
              classNamePrefix="react-select-filter"
              handleOnChange={handleFiscalYearChange}
              label="Fiscal Year End"
              name="fiscal_year_end"
              options={fiscalYearOptions}
              value={
                companyFiscalYear
                  ? fiscalYearOptions.find(o => o.value === companyFiscalYear)
                  : fiscalYearOptions[0]
              }
            />
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 py-6 md:flex-row md:py-8">
      <div className="w-full md:w-18">
        <span className="flex flex-row items-center text-sm font-medium text-foreground">
          <span className="mr-2 w-13">
            <ClockIcon color="#1D1A31" size={13.5} weight="bold" />
          </span>
          Days & Hours
        </span>
      </div>
      <div className="w-full md:w-72">
        <div className="flex flex-row text-sm font-medium">
          <div className="w-1/2 p-2" data-cy="base-currency">
            <CustomInputText
              id="companyWorkingDays"
              label="Weekly Working Days"
              min={0.0}
              name="companyWorkingDays"
              value={companyWorkingDays || ""}
              inputBoxClassName={`${inputClass} ${
                errDetails.companyWorkingDays
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.companyWorkingDays
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e =>
                handleChangeCompanyDetails(e.target.value, "companyWorkingDays")
              }
            />
            {errDetails.companyWorkingDays && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.companyWorkingDays}
              />
            )}
          </div>
          <div className="w-1/2 p-2 text-sm font-medium">
            <CustomInputText
              id="companyWorkingHours"
              label="Weekly Working Hours"
              min={0.0}
              name="companyWorkingHours"
              value={companyWorkingHours || ""}
              inputBoxClassName={`${inputClass} ${
                errDetails.companyNameErr
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.companyNameErr
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e =>
                handleChangeCompanyDetails(
                  e.target.value,
                  "companyWorkingHours"
                )
              }
            />
            {errDetails.companyWorkingHoursErr && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.companyWorkingHoursErr}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between gap-x-2 py-4 md:hidden md:w-0">
      <div className="w-1/2 text-center">
        <button
          className="w-full cursor-pointer rounded border border-primary bg-background py-2 text-base font-bold text-primary"
          onClick={cancelAction}
        >
          Cancel
        </button>
      </div>
      <div className="w-1/2 text-center">
        <button
          className="w-full cursor-pointer rounded bg-primary py-2 text-base font-bold text-primary-foreground"
          onClick={saveAction}
        >
          Save
        </button>
      </div>
    </div>
  </div>
);
