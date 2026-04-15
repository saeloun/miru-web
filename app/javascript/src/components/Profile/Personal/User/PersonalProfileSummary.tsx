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
import { i18n } from "../../../../i18n";

dayjs.extend(customParseFormat);

const PersonalProfileSummary = ({
  avatarUrl,
  personalDetails,
  handleEditClick,
  isCalledFromSettings,
}) => {
  const formatAddress = () => {
    if (!personalDetails.addresses) return i18n.t("profile.noAddressProvided");

    const addr = personalDetails.addresses;
    const parts = [];
    if (addr.address_line_1) parts.push(addr.address_line_1);

    if (addr.address_line_2) parts.push(addr.address_line_2);

    if (addr.city) parts.push(addr.city);

    if (addr.state) parts.push(addr.state);

    if (addr.country) parts.push(addr.country);

    if (addr.pin) parts.push(addr.pin);

    return parts.join(", ") || i18n.t("profile.noAddressProvided");
  };

  const formattedDateOfBirth = personalDetails.date_of_birth
    ? dayjs(
        personalDetails.date_of_birth,
        [personalDetails.date_format, "YYYY-MM-DD", dayjs.ISO_8601],
        true
      ).format("MMMM D, YYYY")
    : null;

  const passwordChangedAt = personalDetails.password_changed_at
    ? dayjs(personalDetails.password_changed_at)
    : null;

  const passwordChangedDaysAgo =
    passwordChangedAt && passwordChangedAt.isValid()
      ? Math.max(dayjs().diff(passwordChangedAt, "day"), 0)
      : 0;

  return (
    <div className="min-h-screen bg-background font-geist">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border shadow-sm lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {i18n.t("profile.personalInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-accent">
                    {avatarUrl ? (
                      <img
                        alt={
                          `${personalDetails.first_name || ""} ${
                            personalDetails.last_name || ""
                          }`.trim() || i18n.t("profile.profilePhoto")
                        }
                        className="h-full w-full object-cover"
                        src={avatarUrl}
                      />
                    ) : (
                      <span className="text-2xl font-geist-bold text-primary">
                        {personalDetails.first_name?.charAt(0)}
                        {personalDetails.last_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-geist-semibold text-foreground">
                      {personalDetails.first_name} {personalDetails.last_name}
                    </h2>
                    <p className="mt-1 text-sm font-geist-regular text-muted-foreground">
                      {personalDetails.email_id ||
                        i18n.t("profile.noEmailProvided")}
                    </p>
                    {formattedDateOfBirth &&
                      formattedDateOfBirth !== "Invalid Date" && (
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-geist-regular text-muted-foreground">
                            {i18n.t("profile.bornOn", {
                              date: formattedDateOfBirth,
                            })}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {i18n.t("clients.phoneNumber")}
                    </label>
                    <p className="mt-1 text-sm font-geist-regular text-foreground">
                      {personalDetails.phone_number ||
                        i18n.t("profile.notProvided")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Envelope className="h-3 w-3" />
                      {i18n.t("profile.personalEmail")}
                    </label>
                    <p className="mt-1 text-sm font-geist-regular text-foreground">
                      {personalDetails.email_id ||
                        i18n.t("profile.notProvided")}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {i18n.t("address")}
                  </label>
                  <p className="mt-1 text-sm font-geist-regular leading-relaxed text-foreground">
                    {formatAddress()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  {i18n.t("profile.socialProfiles")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <LinkedinLogo className="h-3 w-3" />
                      {i18n.t("profile.linkedin")}
                    </label>
                    <p className="mt-1 truncate text-sm font-geist-regular text-foreground">
                      {personalDetails.linkedin ||
                        i18n.t("profile.notConnected")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <GithubLogo className="h-3 w-3" />
                      {i18n.t("profile.github")}
                    </label>
                    <p className="mt-1 truncate text-sm font-geist-regular text-foreground">
                      {personalDetails.github || i18n.t("profile.notConnected")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isCalledFromSettings && (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    {i18n.t("profile.security")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-geist-medium text-foreground">
                          {i18n.t("settings.password")}
                        </p>
                        <p className="mt-0.5 text-xs font-geist-regular text-muted-foreground">
                          {i18n.t("profile.lastChangedDaysAgo", {
                            count: passwordChangedDaysAgo,
                          })}
                        </p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground font-geist-medium">
                        {i18n.t("profile.secure")}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-geist-medium"
                      onClick={handleEditClick}
                    >
                      {i18n.t("settings.changePassword")}
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

export default PersonalProfileSummary;
