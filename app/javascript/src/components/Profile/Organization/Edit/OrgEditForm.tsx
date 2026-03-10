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
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
            Cancel
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
            Save Changes
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Company Identity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo Upload Card */}
            <Card className="overflow-hidden border-border shadow-sm">
              <CardHeader className="pb-4">
                <SectionTitle
                  title="Company Logo"
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
                        Drop logo here or click to upload
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG or GIF (max. 2MB)
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
                            Change
                          </label>
                          <button
                            onClick={handleDeleteLogo}
                            className="flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3 w-3" />
                            Remove
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
                  title="Company Name"
                  icon={<Buildings className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <FormField
                  label="Company Name"
                  required
                  error={errDetails.companyNameErr}
                >
                  <Input
                    type="text"
                    value={companyName}
                    onChange={e =>
                      handleChangeCompanyDetails(e.target.value, "companyName")
                    }
                    placeholder="Enter company name"
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
                  title="Contact Information"
                  icon={<Phone className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    label="Business Phone"
                    error={errDetails.companyPhoneErr}
                  >
                    <PhoneInput
                      className="phone-input-clean"
                      defaultCountry="US"
                      flags={flags}
                      value={companyPhone}
                      onChange={value =>
                        handleChangeCompanyDetails(value, "companyPhone")
                      }
                      inputClassName="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </FormField>

                  <Separator className="my-4" />

                  <SectionTitle
                    title="Business Address"
                    icon={<MapPin className="h-3 w-3" />}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Address Line 1"
                      required
                      error={errDetails.addressLine1Err}
                      className="md:col-span-2"
                    >
                      <Input
                        type="text"
                        value={companyAddr?.addressLine1 || ""}
                        onChange={e =>
                          handleAddrChange(e.target.value, "addressLine1")
                        }
                        placeholder="Street address"
                        className={cn(
                          "border-border",
                          errDetails.addressLine1Err && "border-destructive"
                        )}
                      />
                    </FormField>

                    <FormField label="Address Line 2" className="md:col-span-2">
                      <Input
                        type="text"
                        value={companyAddr?.addressLine2 || ""}
                        onChange={e =>
                          handleAddrChange(e.target.value, "addressLine2")
                        }
                        placeholder="Apartment, suite, etc. (optional)"
                        className="border-border"
                      />
                    </FormField>

                    <FormField
                      label="Country"
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
                        <SelectTrigger className="border-border">
                          <SelectValue placeholder="Select country" />
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
                      label="State/Province"
                      required
                      error={errDetails.stateErr}
                    >
                      <Input
                        type="text"
                        value={companyAddr?.state || ""}
                        onChange={handleStateChange}
                        placeholder="State or province"
                        className={cn(
                          "border-border",
                          errDetails.stateErr && "border-destructive"
                        )}
                      />
                    </FormField>

                    <FormField label="City" required error={errDetails.cityErr}>
                      <Input
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
                      label="ZIP/Postal Code"
                      required
                      error={errDetails.zipcodeErr}
                    >
                      <Input
                        type="text"
                        value={companyAddr?.zipcode || ""}
                        onChange={handleZipcodeChange}
                        placeholder="ZIP code"
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
                  title="Financial Configuration"
                  icon={<CurrencyDollar className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Base Currency">
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
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select currency" />
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
                    label="Standard Rate"
                    required
                    error={errDetails.companyRateErr}
                  >
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
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
                        /hr
                      </span>
                    </div>
                  </FormField>

                  <FormField label="Fiscal Year End">
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
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select month" />
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
                  title="Regional Settings"
                  icon={<Globe className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Timezone">
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
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select timezone" />
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

                  <FormField label="Date Format">
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
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Select format" />
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
                  title="Work Schedule"
                  icon={<CalendarBlank className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Working Days per Week" required>
                    <Input
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

                  <FormField label="Working Hours per Week" required>
                    <Input
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
                  title="Bank Information"
                  icon={<Buildings className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Bank Name">
                    <Input
                      type="text"
                      value={bankName || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "bankName")
                      }
                      className="border-border"
                      placeholder="Enter bank name"
                    />
                  </FormField>

                  <FormField label="Account Number">
                    <Input
                      type="text"
                      value={bankAccountNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "bankAccountNumber"
                        )
                      }
                      className="border-border"
                      placeholder="Enter account number"
                    />
                  </FormField>

                  <FormField label="Routing Number">
                    <Input
                      type="text"
                      value={bankRoutingNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "bankRoutingNumber"
                        )
                      }
                      className="border-border"
                      placeholder="Enter routing number"
                    />
                  </FormField>

                  <FormField label="SWIFT Code">
                    <Input
                      type="text"
                      value={bankSwiftCode || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(
                          e.target.value,
                          "bankSwiftCode"
                        )
                      }
                      className="border-border"
                      placeholder="Enter SWIFT code"
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
                  title="Tax Information"
                  icon={<Hash className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Tax ID">
                    <Input
                      type="text"
                      value={taxId || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "taxId")
                      }
                      className="border-border"
                      placeholder="Enter Tax ID"
                    />
                  </FormField>

                  <FormField label="VAT Number">
                    <Input
                      type="text"
                      value={vatNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "vatNumber")
                      }
                      className="border-border"
                      placeholder="Enter VAT number"
                    />
                  </FormField>

                  <FormField label="GST Number">
                    <Input
                      type="text"
                      value={gstNumber || ""}
                      onChange={e =>
                        handleChangeCompanyDetails(e.target.value, "gstNumber")
                      }
                      className="border-border"
                      placeholder="Enter GST number"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add custom styles for phone input */}
      <style>{`
        .phone-input-clean .PhoneInputInput {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        .phone-input-clean .PhoneInputInput:focus {
          outline: none;
          ring: 2px;
          ring-color: #e5e7eb;
        }
        .phone-input-clean .PhoneInputCountry {
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default OrgEditForm;
