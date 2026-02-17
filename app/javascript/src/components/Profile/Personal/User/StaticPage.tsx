import React from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  User,
  Phone,
  Envelope,
  MapPin,
  GithubLogo,
  LinkedinLogo,
  Calendar,
  Lock,
  Globe,
} from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Separator } from "../../../ui/separator";
import { Badge } from "../../../ui/badge";

dayjs.extend(customParseFormat);

const StaticPage = ({
  personalDetails,
  handleEditClick,
  isCalledFromSettings,
}) => {
  const formatAddress = () => {
    if (!personalDetails.addresses) return "No address provided";

    const addr = personalDetails.addresses;
    const parts = [];
    if (addr.address_line_1) parts.push(addr.address_line_1);

    if (addr.address_line_2) parts.push(addr.address_line_2);

    if (addr.city) parts.push(addr.city);

    if (addr.state) parts.push(addr.state);

    if (addr.country) parts.push(addr.country);

    if (addr.pin) parts.push(addr.pin);

    return parts.join(", ") || "No address provided";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-geist-semibold text-gray-900">
                Profile Settings
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-geist-regular">
                Manage your personal information and preferences
              </p>
            </div>
            <Button
              onClick={handleEditClick}
              className="bg-miru-han-purple-600 hover:bg-miru-han-purple-700 text-white font-geist-medium"
              size="sm"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card className="lg:col-span-2 border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Name and Basic Info */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-miru-han-purple-100 flex items-center justify-center">
                    <span className="text-2xl font-geist-bold text-miru-han-purple-600">
                      {personalDetails.first_name?.charAt(0)}
                      {personalDetails.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-geist-semibold text-gray-900">
                      {personalDetails.first_name} {personalDetails.last_name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 font-geist-regular">
                      {personalDetails.email_id || "No email provided"}
                    </p>
                    {personalDetails.date_of_birth && (
                      <div className="flex items-center gap-1 mt-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 font-geist-regular">
                          Born{" "}
                          {dayjs(personalDetails.date_of_birth).format(
                            "MMMM D, YYYY"
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone Number
                    </label>
                    <p className="text-sm font-geist-regular text-gray-900 mt-1">
                      {personalDetails.phone_number || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Envelope className="h-3 w-3" />
                      Personal Email
                    </label>
                    <p className="text-sm font-geist-regular text-gray-900 mt-1">
                      {personalDetails.email_id || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Address
                  </label>
                  <p className="text-sm font-geist-regular text-gray-900 mt-1 leading-relaxed">
                    {formatAddress()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Profiles Card */}
          <div className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gray-600" />
                  Social Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <LinkedinLogo className="h-3 w-3" />
                      LinkedIn
                    </label>
                    <p className="text-sm font-geist-regular text-gray-900 mt-1 truncate">
                      {personalDetails.linkedin || "Not connected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <GithubLogo className="h-3 w-3" />
                      GitHub
                    </label>
                    <p className="text-sm font-geist-regular text-gray-900 mt-1 truncate">
                      {personalDetails.github || "Not connected"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card - Only show in settings */}
            {isCalledFromSettings && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-600" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-geist-medium text-gray-900">
                          Password
                        </p>
                        <p className="text-xs text-gray-500 font-geist-regular mt-0.5">
                          Last changed 30 days ago
                        </p>
                      </div>
                      <Badge className="bg-green-500 text-white font-geist-medium">
                        Secure
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-geist-medium"
                      onClick={handleEditClick}
                    >
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
