import React from "react";
import { MapPin, Buildings, Globe, Upload, X } from "phosphor-react";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import CustomReactSelect from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";
import { i18n } from "../../../../i18n";
import { Button } from "../../../ui/button";
import { cn } from "../../../../lib/utils";

const InputWrapper = ({ children, className = "" }) => (
  <div className={cn("space-y-1", className)}>{children}</div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-4 w-4 text-primary" />
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
  </div>
);

const FormSection = ({ children, className = "" }) => (
  <div
    className={cn(
      "rounded-lg border border-border bg-card p-4 shadow-sm md:p-6",
      className
    )}
  >
    {children}
  </div>
);

export const OrganizationEditPage = ({
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
      <SectionHeader
        icon={Buildings}
        title={i18n.t("organization.basicDetails")}
      />
      <div className="grid md:grid-cols-2 gap-4">
        {/* Logo Upload */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            {i18n.t("organization.companyLogo")}
          </label>
          <div className="flex items-start gap-4">
            {!logoUrl ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                  "hover:border-border hover:bg-background",
                  isDragActive ? "border-primary bg-accent/60" : "border-border"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {i18n.t("organization.dropLogoHere")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i18n.t("organization.logoFormats")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="h-24 w-24 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={handleDeleteLogo}
                  className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
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
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-foreground/55 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Upload className="h-6 w-6 text-white" />
                </label>
              </div>
            )}
          </div>
        </div>
        {/* Company Name */}
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.companyName")} *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e =>
              handleChangeCompanyDetails(e.target.value, "companyName")
            }
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring/40",
              errDetails.companyNameErr
                ? "border-destructive focus:ring-destructive/20"
                : "border-border hover:border-border"
            )}
            placeholder={i18n.t("organization.enterCompanyName")}
          />
          {errDetails.companyNameErr && (
            <ErrorSpan
              className="text-xs text-destructive"
              message={errDetails.companyNameErr}
            />
          )}
        </InputWrapper>
        {/* Business Phone */}
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.businessPhone")}
          </label>
          <div className="relative">
            <PhoneInput
              className="phone-input-modern"
              defaultCountry="US"
              flags={flags}
              limitMaxLength
              value={companyPhone}
              onChange={value =>
                handleChangeCompanyDetails(value, "companyPhone")
              }
            />
          </div>
        </InputWrapper>
      </div>
    </FormSection>
    {/* Address Section */}
    <FormSection>
      <SectionHeader icon={MapPin} title={i18n.t("organization.address")} />
      <div className="grid md:grid-cols-2 gap-3">
        <InputWrapper className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.addressLine1")} *
          </label>
          <input
            type="text"
            value={companyAddr?.addressLine1 || ""}
            onChange={e => handleAddrChange(e.target.value, "addressLine1")}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring/40",
              errDetails.addressLine1Err
                ? "border-destructive"
                : "border-border hover:border-border"
            )}
            placeholder={i18n.t("organization.streetAddress")}
          />
          {errDetails.addressLine1Err && (
            <ErrorSpan
              className="text-xs text-destructive"
              message={errDetails.addressLine1Err}
            />
          )}
        </InputWrapper>
        <InputWrapper className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.addressLine2")}
          </label>
          <input
            type="text"
            value={companyAddr?.addressLine2 || ""}
            onChange={e => handleAddrChange(e.target.value, "addressLine2")}
            className="w-full px-3 py-2 border border-border rounded-md text-sm hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
            placeholder={i18n.t("organization.addressLine2Placeholder")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.country")} *
          </label>
          <CustomReactSelect
            className="text-sm"
            options={countries}
            value={companyAddr?.country}
            onChange={handleOnChangeCountry}
            placeholder={i18n.t("organization.selectCountry")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.stateProvince")}
          </label>
          <input
            type="text"
            value={companyAddr?.state || ""}
            onChange={handleStateChange}
            className="w-full px-3 py-2 border border-border rounded-md text-sm hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
            placeholder={i18n.t("organization.stateProvincePlaceholder")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.city")}
          </label>
          <input
            type="text"
            value={companyAddr?.city || ""}
            onChange={handleCityChange}
            className="w-full px-3 py-2 border border-border rounded-md text-sm hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
            placeholder={i18n.t("organization.city")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.zipPostalCode")}
          </label>
          <input
            type="text"
            value={companyAddr?.zipcode || ""}
            onChange={handleZipcodeChange}
            className="w-full px-3 py-2 border border-border rounded-md text-sm hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
            placeholder={i18n.t("organization.zipPlaceholder")}
          />
        </InputWrapper>
      </div>
    </FormSection>
    {/* Business Settings */}
    <FormSection>
      <SectionHeader
        icon={Globe}
        title={i18n.t("organization.businessSettings")}
      />
      <div className="grid md:grid-cols-2 gap-3">
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.currency")}
          </label>
          <CustomReactSelect
            className="text-sm"
            options={currenciesOption}
            value={companyCurrency}
            onChange={handleCurrencyChange}
            placeholder={i18n.t("organization.selectCurrency")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.standardRate")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {companyCurrency?.symbol || "$"}
            </span>
            <input
              type="number"
              value={companyRate || ""}
              onChange={e =>
                handleChangeCompanyDetails(e.target.value, "companyRate")
              }
              className="w-full pl-8 pr-3 py-2 border border-border rounded-md text-sm hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="0.00"
            />
          </div>
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.timezone")}
          </label>
          <CustomReactSelect
            className="text-sm"
            options={timezoneOption}
            value={companyTimezone}
            onChange={handleTimezoneChange}
            placeholder={i18n.t("orgSetup.selectTimezone")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.dateFormat")}
          </label>
          <CustomReactSelect
            className="text-sm"
            options={dateFormatOptions}
            value={companyDateFormat}
            onChange={handleDateFormatChange}
            placeholder={i18n.t("orgSetup.selectDateFormat")}
          />
        </InputWrapper>
        <InputWrapper>
          <label className="text-xs font-medium text-muted-foreground">
            {i18n.t("organization.fiscalYearEnd")}
          </label>
          <CustomReactSelect
            className="text-sm"
            options={fiscalYearOptions}
            value={companyFiscalYear}
            onChange={handleFiscalYearChange}
            placeholder={i18n.t("orgSetup.selectFiscalYearEnd")}
          />
        </InputWrapper>
      </div>
    </FormSection>
    {/* Action Buttons */}
    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" onClick={cancelAction} className="px-6">
        {i18n.t("common.cancel")}
      </Button>
      <Button onClick={saveAction} className="px-6 bg-primary hover:bg-primary">
        {i18n.t("common.saveChanges")}
      </Button>
    </div>
  </div>
);

export default OrganizationEditPage;
