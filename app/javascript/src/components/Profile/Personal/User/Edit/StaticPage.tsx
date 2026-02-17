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

const EditProfilePage = ({
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
}) => (
  <div className="min-h-screen bg-gray-50 font-geist">
    {/* Header */}
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h1 className="text-2xl font-geist-semibold text-gray-900">
            Edit Profile
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-geist-regular">
            Update your personal information and account settings
          </p>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-gray-600" weight="bold" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.first_name_err
                        ? "border-red-500 focus:ring-red-500"
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.first_name_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.last_name_err
                        ? "border-red-500 focus:ring-red-500"
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.last_name_err}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2" ref={wrapperRef}>
                <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-miru-han-purple-600"
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
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-600" weight="bold" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="h-3 w-3" weight="bold" />
                    Phone Number
                  </label>
                  <div className="relative flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-miru-han-purple-600 focus-within:ring-offset-2">
                    <PhoneInput
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0 font-geist-regular"
                      flags={flags}
                      inputclassname="form__input block w-full appearance-none bg-transparent border-0 focus:border-0 px-0 text-sm border-transparent focus:border-transparent focus:ring-0 outline-none font-geist-regular"
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
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Envelope className="h-3 w-3" weight="bold" />
                    Personal Email
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.email_id_err
                        ? "border-red-500 focus:ring-red-500"
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.email_id_err}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Address Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" weight="bold" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
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
                <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                  Address Line 1
                </label>
                <Input
                  className={`font-geist-regular ${
                    errDetails.address_line_1_err
                      ? "border-red-500 focus:ring-red-500"
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
                    className="text-xs text-red-600 font-geist-regular"
                    message={errDetails.address_line_1_err}
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                  Address Line 2
                  <span className="text-gray-400 font-geist-regular normal-case text-xs ml-1">
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
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.country_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                    State
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.state_err
                        ? "border-red-500 focus:ring-red-500"
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.state_err}
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                    City
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.city_err
                        ? "border-red-500 focus:ring-red-500"
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.city_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                    Zip/Postal Code
                  </label>
                  <Input
                    className={`font-geist-regular ${
                      errDetails.pin_err
                        ? "border-red-500 focus:ring-red-500"
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
                      className="text-xs text-red-600 font-geist-regular"
                      message={errDetails.pin_err}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Side Column */}
        <div className="space-y-6">
          {/* Social Profiles Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-600" weight="bold" />
                Social Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
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
                <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
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
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-600" weight="bold" />
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
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        className={`font-geist-regular pr-10 ${
                          errDetails.currentPassword_err
                            ? "border-red-500 focus:ring-red-500"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="text-xs text-red-600 font-geist-regular"
                        message={errDetails.currentPassword_err}
                      />
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        className={`font-geist-regular pr-10 ${
                          errDetails.password_err
                            ? "border-red-500 focus:ring-red-500"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="text-xs text-red-600 font-geist-regular"
                        message={errDetails.password_err}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        className={`font-geist-regular pr-10 ${
                          errDetails.confirmPassword_err
                            ? "border-red-500 focus:ring-red-500"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="text-xs text-red-600 font-geist-regular"
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
