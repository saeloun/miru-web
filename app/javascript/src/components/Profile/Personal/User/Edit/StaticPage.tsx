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
} from "phosphor-react";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import CustomDatePicker from "common/CustomDatePicker";
import CustomReactSelect from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../ui/card";
import { Input } from "../../../../ui/input";
import { Button } from "../../../../ui/button";
import { Separator } from "../../../../ui/separator";
import PasskeysPanel from "./PasskeysPanel";

const EditProfilePage = ({
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
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="first_name"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                  >
                    First Name
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
                    placeholder="Enter your first name"
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
                    Last Name
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
                    placeholder="Enter your last name"
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
                  Date of Birth
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
                    disabled
                    className="cursor-pointer font-geist-regular"
                    id="date_of_birth"
                    name="date_of_birth"
                    type="text"
                    placeholder="Select your birth date"
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
                Contact Information
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
                    Phone Number
                  </label>
                  <div className="relative flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <PhoneInput
                      id="phone_number"
                      name="phone_number"
                      aria-label="Phone Number"
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0 font-geist-regular"
                      flags={flags}
                      value={
                        personalDetails.phone_number
                          ? personalDetails.phone_number
                          : ""
                      }
                      onChange={handlePhoneNumberChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="email_id"
                    className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                  >
                    <Envelope className="h-3 w-3" weight="bold" />
                    Personal Email
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
                    placeholder="your.email@example.com"
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
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="address_select"
                  className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  Address Type
                </label>
                <CustomReactSelect
                  handleOnChange={handleOnChangeAddrType}
                  label="Address type"
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
                  Address Line 1
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
                  placeholder="Street address"
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
                  Address Line 2
                  <span className="ml-1 text-xs font-geist-regular normal-case text-muted-foreground/70">
                    (Optional)
                  </span>
                </label>
                <Input
                  className="font-geist-regular"
                  id="address_line_2"
                  name="address_line_2"
                  type="text"
                  placeholder="Apartment, suite, unit, etc."
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
                    Country
                  </label>
                  <CustomReactSelect
                    handleOnChange={value => handleOnChangeCountry(value)}
                    isErr={!!errDetails.country_err}
                    label="Country"
                    name="current_country_select"
                    options={countries}
                    value={{
                      label: personalDetails.addresses.country,
                      value: personalDetails.addresses.country,
                    }}
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
                    State
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
                    placeholder="State or province"
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
                    City
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
                    placeholder="City"
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
                    Zip/Postal Code
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
                    placeholder="12345"
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
                Social Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="linked_in"
                  className="flex items-center gap-1 text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                >
                  <LinkedinLogo className="h-3 w-3" weight="bold" />
                  LinkedIn
                </label>
                <Input
                  className="font-geist-regular"
                  id="linked_in"
                  name="linked_in"
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
                  GitHub
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
          {/* Password Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" weight="bold" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!changePassword && (
                <Button
                  variant="outline"
                  onClick={() => setChangePassword(true)}
                  className="w-full font-geist-medium"
                >
                  Change Password
                </Button>
              )}
              {changePassword && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="current_password"
                      className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Current Password
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
                        placeholder="Enter current password"
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
                      New Password
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
                        placeholder="Enter new password"
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
                      Confirm Password
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
                        placeholder="Re-enter new password"
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
                    Cancel Password Change
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

export default EditProfilePage;
