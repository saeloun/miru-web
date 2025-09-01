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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Organization Settings
              </h1>
              <p className="text-slate-600 mt-2 text-base">
                Manage your company information and preferences
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleEditClick}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PencilSimple className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <Alert variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Basic Details Card */}
            <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/40 border-b border-slate-200/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Buildings className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Basic Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24 rounded-2xl shadow-md border-4 border-white">
                          <AvatarImage
                            src={orgDetails.logoUrl}
                            alt={orgDetails.companyName}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 text-2xl font-bold border-4 border-white">
                            {orgDetails.companyName?.charAt(0) || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                          {orgDetails.companyName || "Company Name"}
                        </h3>
                        <div className="flex items-center space-x-2 text-slate-600">
                          <Globe className="h-4 w-4" />
                          <p className="text-base font-medium">
                            {orgDetails.countryName || "Location not set"}
                          </p>
                        </div>
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          Active Organization
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact & Address Card */}
            <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/40 border-b border-slate-200/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Phone className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Contact & Location
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Business Phone
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 pl-6">
                        {orgDetails.companyPhone || "-"}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Address
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 pl-6 leading-relaxed">
                        {formatAddress(orgDetails.companyAddr)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Settings Card */}
            <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/40 border-b border-slate-200/60 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CurrencyDollar className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Financial Settings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="flex items-center space-x-2">
                        <CurrencyDollar className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Base Currency
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {orgDetails.companyCurrency}
                      </p>
                    </div>
                    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Standard Rate
                        </p>
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-slate-900">
                          $
                          {typeof orgDetails.companyRate === "number"
                            ? orgDetails.companyRate.toFixed(2)
                            : parseFloat(orgDetails.companyRate || 0).toFixed(
                                2
                              )}
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                          / hour
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                          Fiscal Year End
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
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
