import React from "react";
import {
  Buildings,
  Phone,
  CurrencyDollar,
  Globe,
  CalendarBlank,
  MapPin,
  Hash,
  Upload,
  X,
  Check,
} from "phosphor-react";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { ErrorSpan } from "common/ErrorSpan";
import { i18n } from "../../../../i18n";
import { Card, CardContent, CardHeader } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Separator } from "../../../ui/separator";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { cn } from "../../../../lib/utils";

interface OrgEditFormProps {
  orgDetails: {
    companyAddr: any;
    logoUrl: string;
    companyName: string;
    companyPhone: string;
    companyCurrency: string;
    companyRate: string;
    companyTimezone: string;
    companyDateFormat: string;
    companyFiscalYear: string;
    companyWorkingDays: string;
    companyWorkingHours: string;
    bankName: string;
    bankAccountNumber: string;
    bankRoutingNumber: string;
    bankSwiftCode: string;
    taxId: string;
    vatNumber: string;
    gstNumber: string;
    ein: string;
    usTaxpayerId: string;
  };
  isDragActive: boolean;
  getInputProps: () => any;
  getRootProps: () => any;
  handleDeleteLogo: () => void;
  onLogoChange: (e: any) => void;
  errDetails: any;
  handleChangeCompanyDetails: (value: any, field: string) => void;
  handleAddrChange: (value: any, field: string) => void;
  handleOnChangeCountry: (value: any) => void;
  countries: any[];
  handleZipcodeChange: (e: any) => void;
  handleStateChange: (e: any) => void;
  handleCityChange: (e: any) => void;
  handleCurrencyChange: (value: any) => void;
  currenciesOption: any[];
  handleTimezoneChange: (value: any) => void;
  timezoneOption: any[];
  handleDateFormatChange: (value: any) => void;
  dateFormatOptions: any[];
  handleFiscalYearChange: (value: any) => void;
  fiscalYearOptions: any[];
  cancelAction: () => void;
  saveAction: () => void;
  isDetailUpdated?: boolean;
}

const SectionTitle = ({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) => (
  <div className="mb-4 flex items-center gap-2">
    <span className="text-muted-foreground">{icon}</span>
    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
      {title}
    </h3>
  </div>
);

const FormField = ({
  label,
  required = false,
  error,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    <Label
      htmlFor={htmlFor}
      className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
    >
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error && (
      <ErrorSpan className="text-xs text-destructive" message={error} />
    )}
  </div>
);

export const OrgEditForm: React.FC<OrgEditFormProps> = ({
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
  isDetailUpdated = false,
}) => {
  const {
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
    bankName,
    bankAccountNumber,
    bankRoutingNumber,
    bankSwiftCode,
    taxId,
    vatNumber,
    gstNumber,
    ein,
    usTaxpayerId,
  } = orgDetails;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-end gap-3">
          <Button
            onClick={cancelAction}
            variant="outline"
            size="sm"
            className="border-border"
          >
            {i18n.t("common.cancel")}
          </Button>
          <Button
            onClick={saveAction}
            disabled={!isDetailUpdated}
            size="sm"
            className={cn(
              "text-primary-foreground",
              isDetailUpdated
                ? "bg-primary hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            <Check className="h-4 w-4 mr-2" />
            {i18n.t("common.saveChanges")}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Company Identity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo Upload Card */}
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.companyLogo")}
                  icon={<Buildings className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!logoUrl ? (
                    <div
                      {...getRootProps()}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all",
                        "hover:border-primary/40 hover:bg-accent/60",
                        isDragActive
                          ? "border-primary bg-accent"
                          : "border-border"
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {i18n.t("organization.dropLogoHere")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {i18n.t("organization.logoFormats")}
                      </p>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={logoUrl}
                        alt="Company logo"
                        className="h-40 w-full rounded-lg border border-border bg-card p-4 object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/0 transition-all group-hover:bg-background/70">
                        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <label
                            htmlFor="logo-change"
                            className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                          >
                            <Upload className="h-3 w-3" />
                            {i18n.t("common.change")}
                          </label>
                          <button
                            onClick={handleDeleteLogo}
                            className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3 w-3" />
                            {i18n.t("common.remove")}
                          </button>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onLogoChange}
                        className="hidden"
                        id="logo-change"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Name Card */}
            <Card
              className="scroll-mt-24 overflow-hidden border-border shadow-sm"
              id="tax-info"
            >
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.companyName")}
                  icon={<Buildings className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <FormField
                  label={i18n.t("organization.companyName")}
                  required
                  error={errDetails.companyNameErr}
                  htmlFor="company_name"
                >
                  <Input
                    id="company_name"
                    aria-label="Company Name"
                    type="text"
                    value={companyName}
                    onChange={e =>
                      handleChangeCompanyDetails(e.target.value, "companyName")
                    }
                    placeholder={i18n.t("organization.enterCompanyName")}
                    className={cn(
                      "border-border",
                      errDetails.companyNameErr && "border-destructive"
                    )}
                  />
                </FormField>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card
              className="scroll-mt-24 overflow-hidden border-border shadow-sm"
              id="bank-info"
            >
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.contactInformation")}
                  icon={<Phone className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    label={i18n.t("organization.businessPhone")}
                    error={errDetails.companyPhoneErr}
                    htmlFor="company_phone"
                  >
                    <PhoneInput
                      id="company_phone"
                      name="company_phone"
                      aria-label="Business Phone"
                      className="phone-input-clean"
                      defaultCountry="US"
                      flags={flags}
                      value={companyPhone}
                      onChange={value =>
                        handleChangeCompanyDetails(value, "companyPhone")
                      }
                    />
                  </FormField>

                  <Separator className="my-4" />

                  <SectionTitle
                    title={i18n.t("organization.businessAddress")}
                    icon={<MapPin className="h-3 w-3" />}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label={i18n.t("organization.addressLine1")}
                      required
                      error={errDetails.addressLine1Err}
                      className="md:col-span-2"
                      htmlFor="company_address_line_1"
                    >
                      <Input
                        id="company_address_line_1"
                        aria-label="Address Line 1"
                        type="text"
                        value={companyAddr?.addressLine1 || ""}
                        onChange={e =>
                          handleAddrChange(e.target.value, "addressLine1")
                        }
                        placeholder={i18n.t("organization.streetAddress")}
                        className={cn(
                          "border-border",
                          errDetails.addressLine1Err && "border-destructive"
                        )}
                      />
                    </FormField>

                    <FormField
                      label={i18n.t("organization.addressLine2")}
                      className="md:col-span-2"
                      htmlFor="company_address_line_2"
                    >
                      <Input
                        id="company_address_line_2"
                        aria-label="Address Line 2"
                        type="text"
                        value={companyAddr?.addressLine2 || ""}
                        onChange={e =>
                          handleAddrChange(e.target.value, "addressLine2")
                        }
                        placeholder={i18n.t(
                          "organization.addressLine2Placeholder"
                        )}
                        className="border-border"
                      />
                    </FormField>

                    <FormField
                      label={i18n.t("organization.country")}
                      required
                      error={errDetails.countryErr}
                    >
                      <Select
                        value={companyAddr?.country?.value || ""}
                        onValueChange={value => {
                          const selectedCountry = countries.find(
                            c => c.value === value
                          );
                          if (selectedCountry) {
                            handleOnChangeCountry(selectedCountry);
                          }
                        }}
                      >
                        <SelectTrigger
                          aria-label="Country"
                          className="border-border"
                        >
                          <SelectValue
                            placeholder={i18n.t("organization.selectCountry")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem
                              key={country.value}
                              value={country.value}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField
                      label={i18n.t("organization.stateProvince")}
                      required
                      error={errDetails.stateErr}
                      htmlFor="company_state"
                    >
                      <Input
                        id="company_state"
                        aria-label="State/Province"
                        type="text"
                        value={companyAddr?.state || ""}
                        onChange={handleStateChange}
                        placeholder={i18n.t(
                          "organization.stateProvincePlaceholder"
                        )}
                        className={cn(
                          "border-border",
                          errDetails.stateErr && "border-destructive"
                        )}
                      />
                    </FormField>

                    <FormField
                      label={i18n.t("organization.city")}
                      required
                      error={errDetails.cityErr}
                      htmlFor="company_city"
                    >
                      <Input
                        id="company_city"
                        aria-label="City"
                        type="text"
                        value={companyAddr?.city || ""}
                        onChange={handleCityChange}
                        placeholder="City"
                        className={cn(
                          "border-border",
                          errDetails.cityErr && "border-destructive"
                        )}
                      />
                    </FormField>

                    <FormField
                      label={i18n.t("organization.zipPostalCode")}
                      required
                      error={errDetails.zipcodeErr}
                      htmlFor="company_zipcode"
                    >
                      <Input
                        id="company_zipcode"
                        aria-label="ZIP/Postal Code"
                        type="text"
                        value={companyAddr?.zipcode || ""}
                        onChange={handleZipcodeChange}
                        placeholder={i18n.t("organization.zipPlaceholder")}
                        className={cn(
                          "border-border",
                          errDetails.zipcodeErr && "border-destructive"
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Configuration */}
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.financialConfiguration")}
                  icon={<CurrencyDollar className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label={i18n.t("organization.baseCurrency")}>
                    <Select
                      value={
                        typeof companyCurrency === "string"
                          ? companyCurrency
                          : companyCurrency?.value || ""
                      }
                      onValueChange={value => {
                        const selectedCurrency = currenciesOption.find(
                          c => c.value === value
                        );
                        if (selectedCurrency) {
                          handleCurrencyChange(selectedCurrency);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Base Currency"
                        className="border-border"
                      >
                        <SelectValue
                          placeholder={i18n.t("organization.selectCurrency")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {currenciesOption.map(currency => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    label={i18n.t("organization.standardRate")}
                    required
                    error={errDetails.companyRateErr}
                    htmlFor="company_rate"
                  >
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="company_rate"
                        aria-label="Standard Rate"
                        type="number"
                        value={companyRate || ""}
                        onChange={e =>
                          handleChangeCompanyDetails(
                            e.target.value,
                            "companyRate"
                          )
                        }
                        className={cn(
                          "border-border pl-8",
                          errDetails.companyRateErr && "border-destructive"
                        )}
                        placeholder="0.00"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {i18n.t("organization.perHour")}
                      </span>
                    </div>
                  </FormField>

                  <FormField label={i18n.t("organization.fiscalYearEnd")}>
                    <Select
                      value={
                        typeof companyFiscalYear === "string"
                          ? companyFiscalYear
                          : companyFiscalYear?.value || ""
                      }
                      onValueChange={value => {
                        const selectedFiscalYear = fiscalYearOptions.find(
                          f => f.value === value
                        );
                        if (selectedFiscalYear) {
                          handleFiscalYearChange(selectedFiscalYear);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Fiscal Year End"
                        className="border-border"
                      >
                        <SelectValue
                          placeholder={i18n.t("organization.selectMonth")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {fiscalYearOptions.map(fiscalYear => (
                          <SelectItem
                            key={fiscalYear.value}
                            value={fiscalYear.value}
                          >
                            {fiscalYear.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.regionalSettings")}
                  icon={<Globe className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={i18n.t("organization.timezone")}>
                    <Select
                      value={
                        typeof companyTimezone === "string"
                          ? companyTimezone
                          : companyTimezone?.value || ""
                      }
                      onValueChange={value => {
                        const selectedTimezone = timezoneOption.find(
                          t => t.value === value
                        );
                        if (selectedTimezone) {
                          handleTimezoneChange(selectedTimezone);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Timezone"
                        className="border-border"
                      >
                        <SelectValue
                          placeholder={i18n.t("orgSetup.selectTimezone")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOption.map(timezone => (
                          <SelectItem
                            key={timezone.value}
                            value={timezone.value}
                          >
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label={i18n.t("organization.dateFormat")}>
                    <Select
                      value={
                        typeof companyDateFormat === "string"
                          ? companyDateFormat
                          : companyDateFormat?.value || ""
                      }
                      onValueChange={value => {
                        const selectedDateFormat = dateFormatOptions.find(
                          d => d.value === value
                        );
                        if (selectedDateFormat) {
                          handleDateFormatChange(selectedDateFormat);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Date Format"
                        className="border-border"
                      >
                        <SelectValue
                          placeholder={i18n.t("organization.selectFormat")}
                        />
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
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Work Schedule */}
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.workSchedule")}
                  icon={<CalendarBlank className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={i18n.t("organization.workingDaysPerWeek")}
                    required
                    htmlFor="company_working_days"
                  >
                    <Input
                      id="company_working_days"
                      aria-label="Working Days per Week"
                      type="number"
                      value={companyWorkingDays || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "companyWorkingDays"
                        )
                      }
                      className="border-border"
                      placeholder="5"
                      min="1"
                      max="7"
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.workingHoursPerWeek")}
                    required
                    htmlFor="company_working_hours"
                  >
                    <Input
                      id="company_working_hours"
                      aria-label="Working Hours per Week"
                      type="number"
                      value={companyWorkingHours || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "companyWorkingHours"
                        )
                      }
                      className="border-border"
                      placeholder="40"
                      min="1"
                      max="168"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.bankInformation")}
                  icon={<Buildings className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={i18n.t("organization.bankName")}
                    htmlFor="bank_name"
                  >
                    <Input
                      id="bank_name"
                      aria-label="Bank Name"
                      type="text"
                      value={bankName || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "bankName")
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterBankName")}
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.accountNumber")}
                    htmlFor="bank_account_number"
                  >
                    <Input
                      id="bank_account_number"
                      aria-label="Account Number"
                      type="text"
                      value={bankAccountNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "bankAccountNumber"
                        )
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterAccountNumber")}
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.routingNumber")}
                    htmlFor="bank_routing_number"
                  >
                    <Input
                      id="bank_routing_number"
                      aria-label="Routing Number"
                      type="text"
                      value={bankRoutingNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "bankRoutingNumber"
                        )
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterRoutingNumber")}
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.swiftCode")}
                    htmlFor="bank_swift_code"
                  >
                    <Input
                      id="bank_swift_code"
                      aria-label="SWIFT Code"
                      type="text"
                      value={bankSwiftCode || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "bankSwiftCode"
                        )
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterSwiftCode")}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card
              className="scroll-mt-24 overflow-hidden border-border shadow-sm"
              id="tax-info"
            >
              <CardHeader className="pb-4">
                <SectionTitle
                  title={i18n.t("organization.taxInformation")}
                  icon={<Hash className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label={i18n.t("organization.taxId")}
                    htmlFor="tax_id"
                  >
                    <Input
                      id="tax_id"
                      aria-label="Tax ID"
                      type="text"
                      value={taxId || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "taxId")
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterTaxId")}
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.vatNumber")}
                    htmlFor="vat_number"
                  >
                    <Input
                      id="vat_number"
                      aria-label="VAT Number"
                      type="text"
                      value={vatNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "vatNumber")
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterVatNumber")}
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.gstNumber")}
                    htmlFor="gst_number"
                  >
                    <Input
                      id="gst_number"
                      aria-label="GST Number"
                      type="text"
                      value={gstNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "gstNumber")
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterGstNumber")}
                    />
                  </FormField>

                  <FormField label={i18n.t("organization.ein")} htmlFor="ein">
                    <Input
                      id="ein"
                      aria-label="EIN"
                      type="text"
                      value={ein || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "ein")
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterEin")}
                    />
                  </FormField>

                  <FormField
                    label={i18n.t("organization.usTaxpayerId")}
                    htmlFor="us_taxpayer_id"
                  >
                    <Input
                      id="us_taxpayer_id"
                      aria-label="U.S. Taxpayer ID"
                      type="text"
                      value={usTaxpayerId || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "usTaxpayerId"
                        )
                      }
                      className="border-border"
                      placeholder={i18n.t("organization.enterUsTaxpayerId")}
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add custom styles for phone input */}
    </div>
  );
};

export default OrgEditForm;
