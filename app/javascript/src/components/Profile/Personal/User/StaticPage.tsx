import React from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { InfoIcon, KeyIcon, PhoneIcon, MapPinIcon, GlobeIcon } from "miruIcons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../ui/card";

dayjs.extend(customParseFormat);
const StaticPage = ({
  personalDetails,
  handleEditClick,
  isCalledFromSettings,
}) => (
  <div className="min-h-screen bg-background p-6">
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Basic Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <InfoIcon className="h-5 w-5" color="#1D1A31" />
            Basic Details
          </CardTitle>
          <CardDescription>
            Manage your personal information and basic details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-sm">
                {personalDetails.first_name} {personalDetails.last_name}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Date of Birth
              </label>
              <p className="text-sm">{personalDetails.date_of_birth}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Contact Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <PhoneIcon className="h-5 w-5" color="#1D1A31" />
            Contact Details
          </CardTitle>
          <CardDescription>
            Your contact information and communication preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Phone Number
              </label>
              <p className="text-sm">
                {personalDetails.phone_number || "Not provided"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email ID (Personal)
              </label>
              <p className="text-sm">
                {personalDetails.email_id || "Not provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Address Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPinIcon className="h-5 w-5" color="#1D1A31" />
            Address
          </CardTitle>
          <CardDescription>
            Your current address and location information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Address
            </label>
            <p className="text-sm leading-relaxed">
              {personalDetails.addresses ? (
                <>
                  {personalDetails.addresses.address_line_1}
                  {personalDetails.addresses.address_line_2 &&
                    `, ${personalDetails.addresses.address_line_2}`}
                  <br />
                  {personalDetails.addresses.city},{" "}
                  {personalDetails.addresses.state}
                  <br />
                  {personalDetails.addresses.country} -{" "}
                  {personalDetails.addresses.pin}
                </>
              ) : (
                "No address provided"
              )}
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Social Profiles Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <GlobeIcon className="h-5 w-5" color="#1D1A31" />
            Social Profiles
          </CardTitle>
          <CardDescription>
            Your professional and social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                LinkedIn
              </label>
              <p className="text-sm break-all">
                {personalDetails.linkedin || "Not provided"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Github
              </label>
              <p className="text-sm break-all">
                {personalDetails.github || "Not provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Password Section - Only show in settings */}
      {isCalledFromSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <KeyIcon className="h-5 w-5" color="#1D1A31" />
              Password
            </CardTitle>
            <CardDescription>
              Manage your account password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
              onClick={handleEditClick}
            >
              Change Password
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);

export default StaticPage;
