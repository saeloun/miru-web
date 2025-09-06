import React, { useState, useEffect } from "react";
import {
  Buildings,
  CurrencyDollar,
  Clock,
  PencilSimple,
  MapPin,
  Briefcase,
} from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Separator } from "../../../ui/separator";
import { Alert, AlertDescription } from "../../../ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "../../../ui/avatar";
import { Badge } from "../../../ui/badge";
import { companiesApi } from "apis/api";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "../../../ui/skeleton";
import worldCountries from "world-countries";

interface OrganizationDetails {
  id: string | null;
  logoUrl: string;
  companyName: string;
  companyAddr: string | any;
  companyPhone: string;
  countryName: string;
  companyCurrency: string;
  companyRate: number | string;
  companyFiscalYear: string;
  companyDateFormat: string;
  companyTimezone: string;
  logo: any;
  companyWorkingHours: string;
  companyWorkingDays: string;
}

interface ModernOrganizationSettingsProps {
  onBack?: () => void;
}

const ModernOrganizationSettings: React.FC<ModernOrganizationSettingsProps> = ({
  onBack,
}) => {
  const navigate = useNavigate();
  const [orgDetails, setOrgDetails] = useState<OrganizationDetails>({
    id: null,
    logoUrl: "",
    companyName: "",
    companyAddr: "",
    companyPhone: "",
    countryName: "",
    companyCurrency: "",
    companyRate: 0.0,
    companyFiscalYear: "",
    companyDateFormat: "",
    companyTimezone: "",
    logo: null,
    companyWorkingHours: "",
    companyWorkingDays: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await companiesApi.index();
      const companyDetails = { ...res.data.company_details };
      const {
        logo,
        name,
        address,
        business_phone,
        currency,
        standard_price,
        fiscal_year_end,
        date_format,
        timezone,
        country,
        company_logo,
        id,
        working_hours,
        working_days,
      } = companyDetails;

      const countryDetails = worldCountries.find(
        c => c.cca2.toLowerCase() === country?.toLowerCase()
      );

      setOrgDetails({
        id,
        logoUrl: company_logo?.url || logo,
        companyName: name,
        companyAddr: address,
        companyPhone: business_phone,
        countryName: countryDetails?.name?.common || country || "",
        companyCurrency: currency || "USD",
        companyRate: standard_price,
        companyFiscalYear: fiscal_year_end,
        companyDateFormat: date_format,
        companyTimezone: timezone,
        logo: company_logo,
        companyWorkingHours: working_hours || "9:00 AM - 5:00 PM",
        companyWorkingDays: working_days || "Monday - Friday",
      });
    } catch (err) {
      console.error("Failed to fetch organization details:", err);
      setError("Failed to load organization details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    navigate("/settings/organization/edit");
  };

  const formatAddress = (address: string | any) => {
    if (!address || address === "-") return "No address configured";

    // Handle object addresses (likely from the API)
    if (typeof address === "object" && address !== null) {
      const parts = [];
      if (address.address_line_1) parts.push(address.address_line_1);

      if (address.address_line_2) parts.push(address.address_line_2);

      if (address.city) parts.push(address.city);

      if (address.state) parts.push(address.state);

      if (address.zip_code || address.pin) {
        parts.push(address.zip_code || address.pin);
      }

      if (address.country) {
        const countryDetails = worldCountries.find(
          c => c.cca2.toLowerCase() === address.country?.toLowerCase()
        );
        parts.push(countryDetails?.name?.common || address.country);
      }

      return parts.filter(Boolean).join(", ") || "No address configured";
    }

    // Handle string addresses
    if (typeof address === "string") {
      const parts = address.split(",").map(part => part.trim());

      return parts.join(", ");
    }

    return "No address configured";
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-geist-semibold text-gray-900">
                Organization Settings
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-geist-regular">
                Manage your company information and preferences
              </p>
            </div>
            <Button
              onClick={handleEditClick}
              className="bg-miru-han-purple-600 hover:bg-miru-han-purple-700 text-white font-geist-medium"
              size="sm"
            >
              <PencilSimple className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Profile Card */}
            <Card className="lg:col-span-2 border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <Buildings className="h-5 w-5 text-gray-600" />
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-6">
                    {/* Company Header */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 rounded-lg">
                        <AvatarImage
                          src={orgDetails.logoUrl}
                          alt={orgDetails.companyName}
                          className="object-cover rounded-lg"
                        />
                        <AvatarFallback className="rounded-lg bg-miru-han-purple-100 text-miru-han-purple-600 font-geist-bold text-xl">
                          {orgDetails.companyName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="text-xl font-geist-semibold text-gray-900">
                          {orgDetails.companyName || "Company Name"}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1 font-geist-regular">
                          {orgDetails.countryName || "Location not set"}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-2 border-green-200 bg-green-50 text-green-700 font-geist-medium"
                        >
                          <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2" />
                          Active
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                          Business Phone
                        </label>
                        <p className="text-sm font-geist-regular text-gray-900 mt-1">
                          {orgDetails.companyPhone || "Not configured"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                          Currency
                        </label>
                        <p className="text-sm font-geist-semibold text-gray-900 mt-1">
                          {orgDetails.companyCurrency}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Business Address
                      </label>
                      <p className="text-sm font-geist-regular text-gray-900 mt-1 leading-relaxed">
                        {formatAddress(orgDetails.companyAddr)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Settings Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <CurrencyDollar className="h-5 w-5 text-gray-600" />
                  Financial
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                        Standard Rate
                      </label>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-geist-bold text-gray-900">
                          {orgDetails.companyCurrency === "USD" ? "$" : ""}
                          {typeof orgDetails.companyRate === "number"
                            ? orgDetails.companyRate.toFixed(2)
                            : parseFloat(orgDetails.companyRate || "0").toFixed(
                                2
                              )}
                        </span>
                        <span className="text-sm text-gray-500 font-geist-regular">
                          / hour
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                        Fiscal Year End
                      </label>
                      <p className="text-sm font-geist-regular text-gray-900 mt-1">
                        {orgDetails.companyFiscalYear || "Not configured"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Settings Card */}
            <Card className="lg:col-span-2 border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Schedule & Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                        Timezone
                      </label>
                      <p className="text-sm font-geist-regular text-gray-900 mt-1">
                        {orgDetails.companyTimezone || "UTC"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                        Date Format
                      </label>
                      <p className="text-sm font-geist-regular text-gray-900 mt-1">
                        {orgDetails.companyDateFormat || "MM/DD/YYYY"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                        Working Days
                      </label>
                      <p className="text-sm font-geist-regular text-gray-900 mt-1">
                        {orgDetails.companyWorkingDays}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-600" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-3/4" />
                ) : (
                  <p className="text-sm font-geist-medium text-gray-900">
                    {orgDetails.companyWorkingHours}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernOrganizationSettings;
