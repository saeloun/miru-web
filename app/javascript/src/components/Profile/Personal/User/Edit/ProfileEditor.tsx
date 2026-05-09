import React from "react";
import dayjs from "dayjs";
import {
  User,
  Calendar,
  Eye,
  EyeSlash,
  Lock,
  Phone,
  MapPin,
  Globe,
  LinkedinLogo,
  GithubLogo,
  Envelope,
  GlobeSimple,
} from "phosphor-react";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import CustomDatePicker from "common/CustomDatePicker";
import CustomReactSelect from "common/CustomReactSelect";
import { CountryCombobox } from "./CountryCombobox";
import { ErrorSpan } from "common/ErrorSpan";
import { i18n, LANGUAGE_OPTIONS, t } from "../../../../../i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../ui/card";
import { Input } from "../../../../ui/input";
import { Button } from "../../../../ui/button";
import { Separator } from "../../../../ui/separator";
import PasskeysPanel from "./PasskeysPanel";
import TotpPanel from "./TotpPanel";
import LocaleSelector from "../../../../../common/LocaleSelector";

const ProfileEditor = ({
  avatarSection,
  addressOptions,
  addrType,
  countries,
  handleOnChangeAddrType,
  handleOnChangeCountry,
  updateBasicDetails,
  personalDetails,
  showDatePicker,
  setShowDatePicker,
  handleDatePicker,
  errDetails,
  setErrDetails,
  handlePhoneNumberChange,
  wrapperRef,
  changePassword,
  setChangePassword,
  showCurrentPassword,
  _currentPassword,
  _handleCurrentPasswordChange,
  setShowCurrentPassword,
  _getErr,
  showConfirmPassword,
  showPassword,
  _handlePasswordChange,
  _password,
  _confirmPassword,
  setShowPassword,
  _handleConfirmPasswordChange,
  setShowConfirmPassword,
  dateFormat,
  cancelPasswordChange,
  canManagePasskeys,
  onRegisterPasskey,
  onRemovePasskey,
  onTogglePasskeyRequirement,
  passkeyRequiredForLogin,
  passkeys,
  passkeysBusy,
  onConfirmTotp,
  onDisableTotp,
  onGenerateRecoveryCodes,
  onSetupTotp,
  recoveryCodes,
  recoveryCodesCount,
  setTotpVerificationCode,
  totpBusy,
  totpEnabled,
  totpProvisioningUri,
  totpSecret,
  totpVerificationCode,
}) => (
  <div className="min-h-screen bg-background font-geist">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" weight="bold" />
                {i18n.t("profile.personalInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="first_name"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {i18n.t("profile.firstName")}
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.first_name_err
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder={i18n.t("profile.firstNamePlaceholder")}
                    value={personalDetails.first_name || ""}
                    onChange={e => {
                      updateBasicDetails(
                        e.target.value,
                        "first_name",
                        false,
                        ""
                      );
                    }}
                  />
                  {errDetails.first_name_err && (
                    <ErrorSpan
                      className="text-xs text-destructive font-geist-regular"
                      message={errDetails.first_name_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="last_name"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {i18n.t("profile.lastName")}
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.last_name_err
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder={i18n.t("profile.lastNamePlaceholder")}
                    value={personalDetails.last_name || ""}
                    onChange={e => {
                      updateBasicDetails(
                        e.target.value,
                        "last_name",
                        false,
                        ""
                      );
                    }}
                  />
                  {errDetails.last_name_err && (
                    <ErrorSpan
                      className="text-xs text-destructive font-geist-regular"
                      message={errDetails.last_name_err}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2" ref={wrapperRef}>
                <label
                  htmlFor="date_of_birth"
                  className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" weight="bold" />
                  {i18n.t("profile.dateOfBirth")}
                </label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    setShowDatePicker({
                      visibility: !showDatePicker.visibility,
                    });
                  }}
                >
                  <Input
                    readOnly
                    className="cursor-pointer font-geist-regular"
                    id="date_of_birth"
                    name="date_of_birth"
                    type="text"
                    placeholder={i18n.t("profile.birthDatePlaceholder")}
                    value={personalDetails.date_of_birth || ""}
                    onChange={e => {
                      updateBasicDetails(
                        e.target.value,
                        "date_of_birth",
                        false
                      );
                    }}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showDatePicker.visibility && (
                  <CustomDatePicker
                    dateFormat={dateFormat}
                    handleChange={e => handleDatePicker(e, true)}
                    date={
                      personalDetails.date_of_birth
                        ? personalDetails.date_of_birth
                        : dayjs()
                    }
                    maxDate={new Date()}
                  />
                )}
                {errDetails.date_of_birth_err && (
                  <ErrorSpan
                    className="text-xs text-destructive font-geist-regular"
                    message={errDetails.date_of_birth_err}
                  />
                )}
              </div>
            </CardContent>
          </Card>
          {/* Contact Details Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Phone
                  className="h-5 w-5 text-muted-foreground"
                  weight="bold"
                />
                {i18n.t("profile.contactInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="phone_number"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" weight="bold" />
                    {i18n.t("clients.phoneNumber")}
                  </label>
                  <div
                    className={`relative flex h-10 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-offset-2 ${
                      errDetails.phone_number_err
                        ? "border-destructive focus-within:ring-destructive"
                        : "border-input focus-within:ring-ring"
                    }`}
                  >
                    <PhoneInput
                      id="phone_number"
                      name="phone_number"
                      aria-label={i18n.t("profile.phoneAriaLabel")}
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0 font-geist-regular"
                      flags={flags}
                      limitMaxLength
                      value={
                        personalDetails.phone_number
                          ? personalDetails.phone_number
                          : ""
                      }
                      onChange={handlePhoneNumberChange}
                    />
                  </div>
                  {errDetails.phone_number_err && (
                    <ErrorSpan
                      className="text-xs text-destructive font-geist-regular"
                      message={errDetails.phone_number_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="email_id"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                  >
                    <Envelope className="h-3 w-3" weight="bold" />
                    {i18n.t("profile.personalEmail")}
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.email_id_err
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    id="email_id"
                    name="email_id"
                    type="email"
                    placeholder={i18n.t("profile.personalEmailPlaceholder")}
                    value={personalDetails.email_id || ""}
                    onChange={e => {
                      updateBasicDetails(e.target.value, "email_id", false);
                    }}
                  />
                  {errDetails.email_id_err && (
                    <ErrorSpan
                      className="text-xs text-destructive font-geist-regular"
                      message={errDetails.email_id_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="locale"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" weight="bold" />
                    {t("common.language")}
                  </label>
                  <CustomReactSelect
                    handleOnChange={option => {
                      updateBasicDetails(
                        option?.value || "en",
                        "locale",
                        false
                      );
                    }}
                    label={t("common.language")}
                    name="locale"
                    options={LANGUAGE_OPTIONS}
                    value={
                      LANGUAGE_OPTIONS.find(
                        option => option.value === personalDetails.locale
                      ) || LANGUAGE_OPTIONS[0]
                    }
                    className="font-geist-regular"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Address Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <MapPin
                  className="h-5 w-5 text-muted-foreground"
                  weight="bold"
                />
                {i18n.t("address")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="address_select"
                  className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  {i18n.t("profile.addressType")}
                </label>
                <CustomReactSelect
                  handleOnChange={handleOnChangeAddrType}
                  label={i18n.t("profile.addressType")}
                  name="address_select"
                  options={addressOptions}
                  value={addrType.value ? addrType : addressOptions[0]}
                  className="font-geist-regular"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="address_line_1"
                  className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  {i18n.t("profile.addressLine1")}
                </label>
                <Input
                  className={`font-geist-regular ${
                    errDetails.address_line_1_err
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }`}
                  id="address_line_1"
                  name="address_line_1"
                  type="text"
                  placeholder={i18n.t("profile.streetAddressPlaceholder")}
                  value={
                    personalDetails.addresses &&
                    personalDetails.addresses.address_line_1
                  }
                  onChange={e => {
                    updateBasicDetails(e.target.value, "address_line_1", true);
                  }}
                />
                {errDetails.address_line_1_err && (
                  <ErrorSpan
                    className="text-xs font-geist-regular text-destructive"
                    message={errDetails.address_line_1_err}
                  />
                )}
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="address_line_2"
                  className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  {i18n.t("profile.addressLine2")}
                  <span className="ml-1 text-xs font-geist-regular normal-case text-muted-foreground/70">
                    {i18n.t("profile.optionalSuffix")}
                  </span>
                </label>
                <Input
                  className="font-geist-regular"
                  id="address_line_2"
                  name="address_line_2"
                  type="text"
                  placeholder={i18n.t("profile.addressLine2Placeholder")}
                  value={
                    personalDetails.addresses &&
                    personalDetails.addresses.address_line_2
                  }
                  onChange={e => {
                    updateBasicDetails(e.target.value, "address_line_2", true);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="current_country_select"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {i18n.t("country")}
                  </label>
                  <CountryCombobox
                    id="current_country_select"
                    options={countries}
                    value={{
                      label: personalDetails.addresses.country,
                      value: personalDetails.addresses.country,
                    }}
                    onChange={handleOnChangeCountry}
                    isErr={!!errDetails.country_err}
                    className="font-geist-regular"
                  />
                  {errDetails.country_err && (
                    <ErrorSpan
                      className="text-xs font-geist-regular text-destructive"
                      message={errDetails.country_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="state"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {i18n.t("state")}
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.state_err
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    id="state"
                    name="state"
                    type="text"
                    placeholder={i18n.t("profile.statePlaceholder")}
                    value={personalDetails.addresses.state}
                    onChange={e => {
                      updateBasicDetails(e.target.value, "state", true);
                    }}
                  />
                  {errDetails.state_err && (
                    <ErrorSpan
                      className="text-xs font-geist-regular text-destructive"
                      message={errDetails.state_err}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="city"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {i18n.t("city")}
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.city_err
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    id="city"
                    name="city"
                    type="text"
                    placeholder={i18n.t("profile.cityPlaceholder")}
                    value={personalDetails.addresses.city}
                    onChange={e => {
                      updateBasicDetails(e.target.value, "city", true);
                    }}
                  />
                  {errDetails.city_err && (
                    <ErrorSpan
                      className="text-xs font-geist-regular text-destructive"
                      message={errDetails.city_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="zipcode"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {i18n.t("profile.zipPostalCode")}
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.pin_err
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }`}
                    id="zipcode"
                    name="zipcode"
                    type="text"
                    placeholder={i18n.t("profile.zipPlaceholder")}
                    value={personalDetails.addresses.pin}
                    onChange={e => {
                      updateBasicDetails(e.target.value, "pin", true);
                    }}
                  />
                  {errDetails.pin_err && (
                    <ErrorSpan
                      className="text-xs font-geist-regular text-destructive"
                      message={errDetails.pin_err}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <PasskeysPanel
            busy={passkeysBusy}
            canManage={canManagePasskeys}
            onRegister={onRegisterPasskey}
            onRemove={onRemovePasskey}
            onToggleRequirement={onTogglePasskeyRequirement}
            passkeyRequiredForLogin={passkeyRequiredForLogin}
            passkeys={passkeys}
          />
          <TotpPanel
            busy={totpBusy}
            canManage={canManagePasskeys}
            enabled={totpEnabled}
            onConfirm={onConfirmTotp}
            onDisable={onDisableTotp}
            onGenerateRecoveryCodes={onGenerateRecoveryCodes}
            onSetup={onSetupTotp}
            provisioningUri={totpProvisioningUri}
            recoveryCodes={recoveryCodes}
            recoveryCodesCount={recoveryCodesCount}
            secret={totpSecret}
            setVerificationCode={setTotpVerificationCode}
            verificationCode={totpVerificationCode}
          />
        </div>
        {/* Side Column */}
        <div className="space-y-6">
          {avatarSection}
          {/* Social Profiles Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Globe
                  className="h-5 w-5 text-muted-foreground"
                  weight="bold"
                />
                {i18n.t("profile.socialProfiles")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="linkedin"
                  className="flex items-center gap-1 text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  <LinkedinLogo className="h-3 w-3" weight="bold" />
                  {i18n.t("profile.linkedin")}
                </label>
                <Input
                  className="font-geist-regular"
                  id="linkedin"
                  name="linkedin"
                  type="text"
                  placeholder="linkedin.com/in/username"
                  value={personalDetails.linkedin}
                  onChange={e => {
                    updateBasicDetails(e.target.value, "linkedin", false);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="github"
                  className="flex items-center gap-1 text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  <GithubLogo className="h-3 w-3" weight="bold" />
                  {i18n.t("profile.github")}
                </label>
                <Input
                  className="font-geist-regular"
                  id="github"
                  name="github"
                  type="text"
                  placeholder="github.com/username"
                  value={personalDetails.github}
                  onChange={e => {
                    updateBasicDetails(e.target.value, "github", false);
                  }}
                />
              </div>
            </CardContent>
          </Card>
          {/* Language Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <GlobeSimple
                  className="h-5 w-5 text-muted-foreground"
                  weight="bold"
                />
                {i18n.t("common.language")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {i18n.t("profile.languageDescription")}
              </p>
              <LocaleSelector
                dropdownDirection="down"
                showLabel
                onLocaleChange={async newLocale => {
                  try {
                    const csrfToken =
                      document
                        .querySelector('[name="csrf-token"]')
                        ?.getAttribute("content") || "";

                    await fetch("/api/v1/profile", {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                      },
                      credentials: "include",
                      body: JSON.stringify({ user: { locale: newLocale } }),
                    });
                  } catch {
                    // locale still changes locally even if save fails
                  }
                }}
              />
            </CardContent>
          </Card>
          {/* Password Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" weight="bold" />
                {i18n.t("profile.security")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!changePassword && (
                <Button
                  variant="outline"
                  onClick={() => setChangePassword(true)}
                  className="w-full font-geist-medium"
                >
                  {i18n.t("settings.changePassword")}
                </Button>
              )}
              {changePassword && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="current_password"
                      className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {i18n.t("settings.currentPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        className={`font-geist-regular pr-10 ${
                          errDetails.currentPassword_err
                            ? "border-destructive focus:ring-destructive"
                            : ""
                        }`}
                        id="current_password"
                        name="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder={i18n.t(
                          "profile.currentPasswordPlaceholder"
                        )}
                        value={personalDetails.currentPassword}
                        onChange={e => {
                          updateBasicDetails(
                            e.target.value,
                            "currentPassword",
                            false,
                            ""
                          );
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <Eye className="h-4 w-4" weight="bold" />
                        ) : (
                          <EyeSlash className="h-4 w-4" weight="bold" />
                        )}
                      </button>
                    </div>
                    {errDetails.currentPassword_err && (
                      <ErrorSpan
                        className="text-xs font-geist-regular text-destructive"
                        message={errDetails.currentPassword_err}
                      />
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {i18n.t("profile.newPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        className={`font-geist-regular pr-10 ${
                          errDetails.password_err
                            ? "border-destructive focus:ring-destructive"
                            : ""
                        }`}
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={i18n.t("profile.newPasswordPlaceholder")}
                        value={personalDetails.password}
                        onChange={e => {
                          updateBasicDetails(
                            e.target.value,
                            "password",
                            false,
                            ""
                          );
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" weight="bold" />
                        ) : (
                          <EyeSlash className="h-4 w-4" weight="bold" />
                        )}
                      </button>
                    </div>
                    {errDetails.password_err && (
                      <ErrorSpan
                        className="text-xs font-geist-regular text-destructive"
                        message={errDetails.password_err}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="confirm_password"
                      className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {i18n.t("settings.confirmPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        className={`font-geist-regular pr-10 ${
                          errDetails.confirmPassword_err
                            ? "border-destructive focus:ring-destructive"
                            : ""
                        }`}
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={i18n.t(
                          "profile.confirmPasswordPlaceholder"
                        )}
                        value={personalDetails.confirmPassword}
                        onChange={e => {
                          updateBasicDetails(
                            e.target.value,
                            "confirmPassword",
                            false,
                            ""
                          );
                        }}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <Eye className="h-4 w-4" weight="bold" />
                        ) : (
                          <EyeSlash className="h-4 w-4" weight="bold" />
                        )}
                      </button>
                    </div>
                    {errDetails.confirmPassword_err && (
                      <ErrorSpan
                        className="text-xs font-geist-regular text-destructive"
                        message={errDetails.confirmPassword_err}
                      />
                    )}
                  </div>
                  <Button
                    className="text-sm font-geist-medium"
                    variant="ghost"
                    onClick={() => {
                      setErrDetails({
                        ...errDetails,
                        password_err: "",
                        confirmPassword_err: "",
                      });
                      cancelPasswordChange();
                    }}
                  >
                    {i18n.t("profile.cancelPasswordChange")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileEditor;
