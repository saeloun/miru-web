import React from "react";

import { DeleteIcon } from "miruIcons";
import Select from "react-select";

import { Divider } from "common/Divider";

export const StaticPage = ({
  orgDetails,
  EditImageButtonSVG,
  onLogoChange,
  handleDeleteLogo,
  handleNameChange,
  PlusIconSVG,
  errDetails,
  countriesOption,
  handleAddrChange,
  handlePhoneChange,
  handleCountryChange,
  handleRateChange,
  customStyles,
  currenciesOption,
  handleCurrencyChange,
  handleDateFormatChange,
  timezoneOption,
  fiscalYearOptions,
  handleFiscalYearChange,
  dateFormatOptions,
  handleTimezoneChange,
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex flex-row py-6">
      <div className="w-4/12 p-2 font-bold">Basic Details</div>
      <div className="w-full p-2">
        Logo
        {orgDetails.logoUrl ? (
          <div className="mt-2 flex flex-row">
            <div className="h-20 w-20">
              <img
                alt="org_logo"
                className="h-full min-w-full rounded-full"
                src={orgDetails.logoUrl}
              />
            </div>
            <label htmlFor="file-input">
              <img
                alt="edit"
                className="mt-5 cursor-pointer rounded-full"
                src={EditImageButtonSVG}
                style={{ minWidth: "40px" }}
              />
            </label>
            <input
              className="hidden"
              id="file-input"
              name="myImage"
              type="file"
              onChange={onLogoChange}
            />
            <button data-cy="delete-logo" onClick={handleDeleteLogo}>
              <DeleteIcon
                className="mt-5 ml-2 cursor-pointer rounded-full"
                style={{ minWidth: "40px" }}
              />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-2 h-20 w-20 rounded border border-miru-han-purple-1000">
              <label
                className="items-cente flex h-full w-full cursor-pointer justify-center"
                htmlFor="file-input"
              >
                <img
                  alt="file_input"
                  className="object-none"
                  src={PlusIconSVG}
                />
              </label>
            </div>
            <input
              className="hidden"
              id="file-input"
              name="myImage"
              type="file"
              onChange={onLogoChange}
            />
          </>
        )}
        <div className="mt-4 flex w-1/2 flex-col">
          <label className="mb-2">Company Name</label>
          <input
            className="w-full border py-1 px-1"
            data-cy="company-name"
            id="company_name"
            name="company_name"
            type="text"
            value={orgDetails.companyName}
            onChange={handleNameChange}
          />
          {errDetails.companyNameErr && (
            <span className="text-sm text-red-600">
              {errDetails.companyNameErr}
            </span>
          )}
        </div>
      </div>
    </div>
    <Divider />
    <div className="flex flex-row py-6">
      <div className="w-4/12 p-2 font-bold">Contact Details</div>
      <div className="w-full p-2">
        <div className="flex flex-col ">
          <label className="mb-2">Address</label>
          <textarea
            className="w-5/6 border py-1 px-1	"
            data-cy="address"
            id="company_addr"
            name="company_addr"
            value={orgDetails.companyAddr}
            onChange={handleAddrChange}
          />
          <label className="mb-2 mt-4">Business Phone</label>
          <input
            className="w-80 border py-1 px-1"
            data-cy="business-phone"
            id="company_phone"
            name="company_phone"
            type="text"
            value={orgDetails.companyPhone}
            onChange={handlePhoneChange}
          />
          {errDetails.companyPhoneErr && (
            <span className="text-sm text-red-600">
              {errDetails.companyPhoneErr}
            </span>
          )}
        </div>
      </div>
    </div>
    <Divider />
    <div className="flex flex-row py-6">
      <div className="mt-2 w-4/12 p-2 font-bold">Location and Currency</div>
      <div className=" w-full p-2">
        <div className="flex flex-row ">
          <div className="w-1/2 p-2" data-cy="country">
            <label className="mb-2">Country</label>
            <Select
              className="mt-2"
              classNamePrefix="react-select-filter"
              options={countriesOption}
              styles={customStyles}
              value={
                orgDetails.countryName
                  ? countriesOption.find(
                      o => o.value === orgDetails.countryName
                    )
                  : { label: "United States", value: "US" }
              }
              onChange={handleCountryChange}
            />
          </div>
          <div className="w-1/2 p-2" data-cy="base-currency">
            <label className="mb-2">Base Currency</label>
            <Select
              className="mt-2"
              classNamePrefix="react-select-filter"
              options={currenciesOption}
              styles={customStyles}
              value={
                orgDetails.companyCurrency
                  ? currenciesOption.find(
                      o => o.value === orgDetails.companyCurrency
                    )
                  : { label: "US Dollar ($)", value: "USD" }
              }
              onChange={handleCurrencyChange}
            />
          </div>
        </div>
        <div className="flex w-1/2 flex-col p-2">
          <label className="mb-2">Standard Rate</label>
          <input
            className="w-full border py-1 px-1"
            data-cy="standard-rate"
            id="company_rate"
            min={0}
            name="company_rate"
            type="number"
            value={orgDetails.companyRate}
            onChange={handleRateChange}
          />
          {errDetails.companyRateErr && (
            <span className="text-sm text-red-600">
              {errDetails.companyRateErr}
            </span>
          )}
        </div>
      </div>
    </div>
    <Divider />
    <div className="flex flex-row py-6">
      <div className="mt-2 w-4/12 p-2 font-bold">Date and Time</div>
      <div className="w-full p-2">
        <div className="flex flex-row ">
          <div className="w-1/2 p-2" data-cy="timezone">
            <label className="mb-2">Timezone</label>
            <Select
              className="mt-2"
              classNamePrefix="react-select-filter"
              options={timezoneOption}
              styles={customStyles}
              value={
                orgDetails.companyTimezone
                  ? timezoneOption.find(
                      o => o.value === orgDetails.companyTimezone
                    )
                  : timezoneOption[0]
              }
              onChange={handleTimezoneChange}
            />
          </div>
          <div className="w-1/2 p-2" data-cy="date-format">
            <label className="mb-2">Date Format</label>
            <Select
              className="mt-2"
              classNamePrefix="react-select-filter"
              options={dateFormatOptions}
              styles={customStyles}
              value={
                orgDetails.companyDateFormat
                  ? dateFormatOptions.find(
                      o => o.value === orgDetails.companyDateFormat
                    )
                  : dateFormatOptions[1]
              }
              onChange={handleDateFormatChange}
            />
          </div>
        </div>
        <div className="flex w-1/2 flex-col p-2" data-cy="fiscal-year">
          <label className="mb-2"> Fiscal Year End</label>
          <Select
            className="mt-2"
            classNamePrefix="react-select-filter"
            options={fiscalYearOptions}
            styles={customStyles}
            value={
              orgDetails.companyFiscalYear
                ? fiscalYearOptions.find(
                    o => o.value === orgDetails.companyFiscalYear
                  )
                : fiscalYearOptions[0]
            }
            onChange={handleFiscalYearChange}
          />
        </div>
      </div>
    </div>
  </div>
);
