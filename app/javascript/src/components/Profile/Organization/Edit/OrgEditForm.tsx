import React from "react";
import {
  Buildings,
  Phone,
  CurrencyDollar,
  Calendar,
  Clock,
  Globe,
  CalendarBlank,
  MapPin,
  Hash,
  Upload,
  X,
  ArrowLeft,
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
  <div className="flex items-center gap-2 mb-4">
    <span className="text-gray-400">{icon}</span>
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
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
    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
    {error && <ErrorSpan className="text-xs text-red-600" message={error} />}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={cancelAction}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Organization Settings
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Update your company's information and preferences
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={cancelAction}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={saveAction}
                disabled={!isDetailUpdated}
                size="sm"
                className={cn(
                  "text-white",
                  isDetailUpdated
                    ? "bg-gray-900 hover:bg-gray-800"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Identity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo Upload Card */}
            <Card className="overflow-hidden border-0 shadow-sm">
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
                        "border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all",
                        "hover:border-gray-400 hover:bg-gray-50",
                        "flex flex-col items-center justify-center",
                        isDragActive
                          ? "border-gray-600 bg-gray-50"
                          : "border-gray-300"
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700">
                        Drop logo here or click to upload
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG or GIF (max. 2MB)
                      </p>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={logoUrl}
                        alt="Company logo"
                        className="w-full h-40 object-contain rounded-lg border border-gray-200 p-4 bg-white"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <label
                            htmlFor="logo-change"
                            className="bg-white text-gray-700 rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-gray-100 flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Change
                          </label>
                          <button
                            onClick={handleDeleteLogo}
                            className="bg-white text-red-600 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-red-50 flex items-center gap-1"
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
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      "border-gray-200",
                      errDetails.companyNameErr && "border-red-500"
                    )}
                  />
                </FormField>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      inputClassName="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                          "border-gray-200",
                          errDetails.addressLine1Err && "border-red-500"
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
                        className="border-gray-200"
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
                        <SelectTrigger className="border-gray-200">
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
                          "border-gray-200",
                          errDetails.stateErr && "border-red-500"
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
                          "border-gray-200",
                          errDetails.cityErr && "border-red-500"
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
                          "border-gray-200",
                          errDetails.zipcodeErr && "border-red-500"
                        )}
                      />
                    </FormField>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Configuration */}
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      <SelectTrigger className="border-gray-200">
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
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
                          "pl-8 border-gray-200",
                          errDetails.companyRateErr && "border-red-500"
                        )}
                        placeholder="0.00"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
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
                      <SelectTrigger className="border-gray-200">
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
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      <SelectTrigger className="border-gray-200">
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
                      <SelectTrigger className="border-gray-200">
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
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      className="border-gray-200"
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
                      className="border-gray-200"
                      placeholder="40"
                      min="1"
                      max="168"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      className="border-gray-200"
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
                      className="border-gray-200"
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
                      className="border-gray-200"
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
                      className="border-gray-200"
                      placeholder="Enter SWIFT code"
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card className="overflow-hidden border-0 shadow-sm">
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
                      className="border-gray-200"
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
                      className="border-gray-200"
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
                      className="border-gray-200"
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
      <style jsx global>{`
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
