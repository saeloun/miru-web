import React, { useState, useEffect } from "react";
import {
  Buildings,
  Phone,
  CurrencyDollar,
  Calendar,
  Clock,
  PencilSimple,
  Globe,
  CalendarBlank,
  Warning,
  MapPin,
  Briefcase,
} from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Separator } from "../../../ui/separator";
import { Alert, AlertDescription } from "../../../ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "../../../ui/avatar";
import companiesApi from "../../../../apis/companies";
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
        companyCurrency: currency || "-",
        companyRate: standard_price,
        companyFiscalYear: fiscal_year_end,
        companyDateFormat: date_format,
        companyTimezone: timezone,
        logo: company_logo,
        companyWorkingHours: working_hours || "-",
        companyWorkingDays: working_days || "-",
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
    if (!address || address === "-") return "-";

    // Handle object addresses (likely from the API)
    if (typeof address === "object" && address !== null) {
      const parts = [];
      if (address.address_line_1) parts.push(address.address_line_1);

      if (address.address_line_2) parts.push(address.address_line_2);

      if (address.city) parts.push(address.city);

      if (address.state) parts.push(address.state);

      if (address.zip_code) parts.push(address.zip_code);

      if (address.country) parts.push(address.country);

      return parts.filter(Boolean).join(", ") || "-";
    }

    // Handle string addresses
    if (typeof address === "string") {
      const parts = address.split(",").map(part => part.trim());

      return parts.join(", ");
    }

    return "-";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Organization Settings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your company information and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleEditClick}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <PencilSimple className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <Alert variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Basic Details Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center space-x-2">
                  <Buildings className="h-5 w-5 text-gray-600" />
                  <CardTitle>Basic Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-20 w-20 rounded-lg">
                        <AvatarImage
                          src={orgDetails.logoUrl}
                          alt={orgDetails.companyName}
                        />
                        <AvatarFallback className="rounded-lg bg-gray-100 text-gray-600 text-xl font-semibold">
                          {orgDetails.companyName?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {orgDetails.companyName || "Company Name"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {orgDetails.countryName || "Location not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact & Address Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <CardTitle>Contact & Location</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Phone
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {orgDetails.companyPhone || "-"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {formatAddress(orgDetails.companyAddr)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Settings Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center space-x-2">
                  <CurrencyDollar className="h-5 w-5 text-gray-600" />
                  <CardTitle>Financial Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Currency
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {orgDetails.companyCurrency}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Standard Rate
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        <span className="text-xl">
                          $
                          {typeof orgDetails.companyRate === "number"
                            ? orgDetails.companyRate.toFixed(2)
                            : parseFloat(orgDetails.companyRate || 0).toFixed(
                                2
                              )}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          / hour
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiscal Year End
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {orgDetails.companyFiscalYear || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date & Time Settings Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <CardTitle>Date & Time Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timezone
                      </p>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">
                          {orgDetails.companyTimezone || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Format
                      </p>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-base font-medium text-gray-900">
                          {orgDetails.companyDateFormat || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center space-x-2">
                  <CalendarBlank className="h-5 w-5 text-gray-600" />
                  <CardTitle>Working Hours</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weekly Working Days
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {orgDetails.companyWorkingDays}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weekly Working Hours
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {orgDetails.companyWorkingHours}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/settings/holidays")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Holidays
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/settings/payment")}
                  >
                    <CurrencyDollar className="h-4 w-4 mr-2" />
                    Payment Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/settings/leaves")}
                  >
                    <CalendarBlank className="h-4 w-4 mr-2" />
                    Leave Types
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernOrganizationSettings;
