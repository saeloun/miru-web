import React from "react";
import { MapPinIcon, Buildings, Globe, Upload, X } from "phosphor-react";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import CustomReactSelect from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";
import { Button } from "../../../ui/button";
import { cn } from "../../../../lib/utils";

const InputWrapper = ({ children, className = "" }) => (
  <div className={cn("space-y-1", className)}>{children}</div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-4 w-4 text-miru-han-purple-600" />
    <h3 className="text-sm font-semibold text-miru-dark-purple-1000">
      {title}
    </h3>
  </div>
);

const FormSection = ({ children, className = "" }) => (
  <div
    className={cn(
      "bg-white rounded-lg p-4 md:p-6 shadow-sm border border-miru-gray-200",
      className
    )}
  >
    {children}
  </div>
);

export const ModernStaticPage = ({
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
  <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
    {/* Basic Details Section */}
    <FormSection>
      <SectionHeader icon={Buildings} title="Basic Details" />
      <div className="grid md:grid-cols-2 gap-4">
        {/* Logo Upload */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-miru-dark-purple-600 mb-2">
            Company Logo
          </label>
          <div className="flex items-start gap-4">
            {!logoUrl ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                  "hover:border-miru-han-purple-400 hover:bg-miru-gray-50",
                  isDragActive
                    ? "border-miru-han-purple-600 bg-miru-han-purple-50"
                    : "border-miru-gray-300"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-miru-gray-400" />
                  <p className="text-sm text-miru-dark-purple-600">
                    Drop logo here or click to upload
                  </p>
                  <p className="text-xs text-miru-gray-500">
                    JPG, PNG or GIF (max. 2MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="h-24 w-24 rounded-lg object-cover border border-miru-gray-200"
                />
                <button
                  onClick={handleDeleteLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="hidden"
                  id="logo-change"
                />
                <label
                  htmlFor="logo-change"
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-white" />
                </label>
              </div>
            )}
          </div>
        </div>
        {/* Company Name */}
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Company Name *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e =>
              handleChangeCompanyDetails(e.target.value, "companyName")
            }
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200",
              errDetails.companyNameErr
                ? "border-red-500 focus:ring-red-200"
                : "border-miru-gray-300 hover:border-miru-gray-400"
            )}
            placeholder="Enter company name"
          />
          {errDetails.companyNameErr && (
            <ErrorSpan
              className="text-xs text-red-600"
              message={errDetails.companyNameErr}
            />
          )}
        </InputWrapper>
        {/* Business Phone */}
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Business Phone
          </label>
          <div className="relative">
            <PhoneInput
              className="phone-input-modern"
              defaultCountry="US"
              flags={flags}
              value={companyPhone}
              onChange={value =>
                handleChangeCompanyDetails(value, "companyPhone")
              }
              inputClassName="w-full px-3 py-2 border border-miru-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200"
            />
          </div>
        </InputWrapper>
      </div>
    </FormSection>
    {/* Address Section */}
    <FormSection>
      <SectionHeader icon={MapPinIcon} title="Address" />
      <div className="grid md:grid-cols-2 gap-3">
        <InputWrapper className="md:col-span-2">
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Address Line 1 *
          </label>
          <input
            type="text"
            value={companyAddr?.addressLine1 || ""}
            onChange={e => handleAddrChange(e.target.value, "addressLine1")}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              "focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200",
              errDetails.addressLine1Err
                ? "border-red-500"
                : "border-miru-gray-300 hover:border-miru-gray-400"
            )}
            placeholder="Street address"
          />
          {errDetails.addressLine1Err && (
            <ErrorSpan
              className="text-xs text-red-600"
              message={errDetails.addressLine1Err}
            />
          )}
        </InputWrapper>
        <InputWrapper className="md:col-span-2">
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Address Line 2
          </label>
          <input
            type="text"
            value={companyAddr?.addressLine2 || ""}
            onChange={e => handleAddrChange(e.target.value, "addressLine2")}
            className="w-full px-3 py-2 border border-miru-gray-300 rounded-md text-sm hover:border-miru-gray-400 focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200"
            placeholder="Apartment, suite, etc. (optional)"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Country *
          </label>
          <CustomReactSelect
            className="text-sm"
            options={countries}
            value={companyAddr?.country}
            onChange={handleOnChangeCountry}
            placeholder="Select country"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            State/Province
          </label>
          <input
            type="text"
            value={companyAddr?.state || ""}
            onChange={handleStateChange}
            className="w-full px-3 py-2 border border-miru-gray-300 rounded-md text-sm hover:border-miru-gray-400 focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200"
            placeholder="State or province"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            City
          </label>
          <input
            type="text"
            value={companyAddr?.city || ""}
            onChange={handleCityChange}
            className="w-full px-3 py-2 border border-miru-gray-300 rounded-md text-sm hover:border-miru-gray-400 focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200"
            placeholder="City"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            ZIP/Postal Code
          </label>
          <input
            type="text"
            value={companyAddr?.zipcode || ""}
            onChange={handleZipcodeChange}
            className="w-full px-3 py-2 border border-miru-gray-300 rounded-md text-sm hover:border-miru-gray-400 focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200"
            placeholder="ZIP code"
          />
        </InputWrapper>
      </div>
    </FormSection>
    {/* Business Settings */}
    <FormSection>
      <SectionHeader icon={Globe} title="Business Settings" />
      <div className="grid md:grid-cols-2 gap-3">
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Currency
          </label>
          <CustomReactSelect
            className="text-sm"
            options={currenciesOption}
            value={companyCurrency}
            onChange={handleCurrencyChange}
            placeholder="Select currency"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Standard Rate
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-miru-dark-purple-600">
              {companyCurrency?.symbol || "$"}
            </span>
            <input
              type="number"
              value={companyRate || ""}
              onChange={e =>
                handleChangeCompanyDetails(e.target.value, "companyRate")
              }
              className="w-full pl-8 pr-3 py-2 border border-miru-gray-300 rounded-md text-sm hover:border-miru-gray-400 focus:outline-none focus:ring-2 focus:ring-miru-han-purple-200"
              placeholder="0.00"
            />
          </div>
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Timezone
          </label>
          <CustomReactSelect
            className="text-sm"
            options={timezoneOption}
            value={companyTimezone}
            onChange={handleTimezoneChange}
            placeholder="Select timezone"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Date Format
          </label>
          <CustomReactSelect
            className="text-sm"
            options={dateFormatOptions}
            value={companyDateFormat}
            onChange={handleDateFormatChange}
            placeholder="Select date format"
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-miru-dark-purple-600">
            Fiscal Year End
          </label>
          <CustomReactSelect
            className="text-sm"
            options={fiscalYearOptions}
            value={companyFiscalYear}
            onChange={handleFiscalYearChange}
            placeholder="Select fiscal year end"
          />
        </InputWrapper>
      </div>
    </FormSection>
    {/* Action Buttons */}
    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" onClick={cancelAction} className="px-6">
        Cancel
      </Button>
      <Button
        onClick={saveAction}
        className="px-6 bg-miru-han-purple-600 hover:bg-miru-han-purple-700"
      >
        Save Changes
      </Button>
    </div>
  </div>
);

export default ModernStaticPage;
