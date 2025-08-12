import React from "react";

import dayjs from "dayjs";
import {
  InfoIcon,
  CalendarIcon,
  PasswordIconSVG,
  PasswordIconTextSVG,
  KeyIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeIcon,
} from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import CustomDatePicker from "common/CustomDatePicker";
import CustomReactSelect from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../ui/card";
import { Input } from "../../../../ui/input";
import { Button } from "../../../../ui/button";

const StaticPage = ({
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
            Update your personal information and basic details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                First name
              </label>
              <Input
                className={errDetails.first_name_err ? "border-red-500" : ""}
                id="first_name"
                name="first_name"
                type="text"
                value={personalDetails.first_name || ""}
                onChange={e => {
                  updateBasicDetails(e.target.value, "first_name", false, "");
                }}
              />
              {errDetails.first_name_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.first_name_err}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Last name
              </label>
              <Input
                className={errDetails.last_name_err ? "border-red-500" : ""}
                id="last_name"
                name="last_name"
                type="text"
                value={personalDetails.last_name || ""}
                onChange={e => {
                  updateBasicDetails(e.target.value, "last_name", false, "");
                }}
              />
              {errDetails.last_name_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.last_name_err}
                />
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2" ref={wrapperRef}>
            <label className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </label>
            <div
              className="relative cursor-pointer"
              onClick={() => {
                setShowDatePicker({ visibility: !showDatePicker.visibility });
              }}
            >
              <Input
                disabled
                className="cursor-pointer"
                id="date_of_birth"
                name="date_of_birth"
                type="text"
                value={personalDetails.date_of_birth || ""}
                onChange={e => {
                  updateBasicDetails(e.target.value, "date_of_birth", false);
                }}
              />
              <CalendarIcon
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                color="#5B34EA"
                size={20}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <PhoneIcon className="h-5 w-5" color="#1D1A31" />
            Contact Details
          </CardTitle>
          <CardDescription>
            Update your contact information and communication preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Phone number
              </label>
              <div className="relative flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <PhoneInput
                  className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                  flags={flags}
                  inputclassname="form__input block w-full appearance-none bg-transparent border-0 focus:border-0 px-0 text-sm border-transparent focus:border-transparent focus:ring-0 outline-none"
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
              <label className="text-sm font-medium text-muted-foreground">
                Email ID (Personal)
              </label>
              <Input
                className={errDetails.email_id_err ? "border-red-500" : ""}
                id="email_id"
                name="email_id"
                type="email"
                value={personalDetails.email_id || ""}
                onChange={e => {
                  updateBasicDetails(e.target.value, "email_id", false);
                }}
              />
              {errDetails.email_id_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.email_id_err}
                />
              )}
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
            Update your current address and location information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Address type
            </label>
            <CustomReactSelect
              handleOnChange={handleOnChangeAddrType}
              label="Address type"
              name="address_select"
              options={addressOptions}
              value={addrType.value ? addrType : addressOptions[0]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Address line 1
            </label>
            <Input
              className={errDetails.address_line_1_err ? "border-red-500" : ""}
              id="address_line_1"
              name="address_line_1"
              type="text"
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
                className="text-xs text-red-600"
                message={errDetails.address_line_1_err}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Address line 2 (optional)
            </label>
            <Input
              id="address_line_2"
              name="address_line_2"
              type="text"
              value={
                personalDetails.addresses &&
                personalDetails.addresses.address_line_2
              }
              onChange={e => {
                updateBasicDetails(e.target.value, "address_line_2", true);
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
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
              />
              {errDetails.country_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.country_err}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                State
              </label>
              <Input
                className={errDetails.state_err ? "border-red-500" : ""}
                id="state"
                name="state"
                type="text"
                value={personalDetails.addresses.state}
                onChange={e => {
                  updateBasicDetails(e.target.value, "state", true);
                }}
              />
              {errDetails.state_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.state_err}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                City
              </label>
              <Input
                className={errDetails.city_err ? "border-red-500" : ""}
                id="city"
                name="city"
                type="text"
                value={personalDetails.addresses.city}
                onChange={e => {
                  updateBasicDetails(e.target.value, "city", true);
                }}
              />
              {errDetails.city_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.city_err}
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Zipcode
              </label>
              <Input
                className={errDetails.pin_err ? "border-red-500" : ""}
                id="zipcode"
                name="zipcode"
                type="text"
                value={personalDetails.addresses.pin}
                onChange={e => {
                  updateBasicDetails(e.target.value, "pin", true);
                }}
              />
              {errDetails.pin_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.pin_err}
                />
              )}
            </div>
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
            Update your professional and social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                LinkedIn
              </label>
              <Input
                id="linked_in"
                name="linked_in"
                type="text"
                value={personalDetails.linkedin}
                onChange={e => {
                  updateBasicDetails(e.target.value, "linkedin", false);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Github
              </label>
              <Input
                id="github"
                name="github"
                type="text"
                value={personalDetails.github}
                onChange={e => {
                  updateBasicDetails(e.target.value, "github", false);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Password Card */}
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
          {!changePassword && (
            <Button variant="outline" onClick={() => setChangePassword(true)}>
              Change Password
            </Button>
          )}
          {changePassword && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="current_password"
                    name="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={personalDetails.currentPassword}
                    className={
                      errDetails.currentPassword_err
                        ? "border-red-500 pr-10"
                        : "pr-10"
                    }
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <img
                        alt="pass_icon_text"
                        className="h-4 w-4"
                        src={PasswordIconTextSVG}
                      />
                    ) : (
                      <img
                        alt="pass_icon"
                        className="h-4 w-4"
                        src={PasswordIconSVG}
                      />
                    )}
                  </button>
                </div>
                {errDetails.currentPassword_err && (
                  <ErrorSpan
                    className="text-xs text-red-600"
                    message={errDetails.currentPassword_err}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={personalDetails.password}
                      className={
                        errDetails.password_err
                          ? "border-red-500 pr-10"
                          : "pr-10"
                      }
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <img
                          alt="pass_icon_text"
                          className="h-4 w-4"
                          src={PasswordIconTextSVG}
                        />
                      ) : (
                        <img
                          alt="pass_icon"
                          className="h-4 w-4"
                          src={PasswordIconSVG}
                        />
                      )}
                    </button>
                  </div>
                  {errDetails.password_err && (
                    <ErrorSpan
                      className="text-xs text-red-600"
                      message={errDetails.password_err}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={personalDetails.confirmPassword}
                      className={
                        errDetails.confirmPassword_err
                          ? "border-red-500 pr-10"
                          : "pr-10"
                      }
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <img
                          alt="pass_icon_text"
                          className="h-4 w-4"
                          src={PasswordIconTextSVG}
                        />
                      ) : (
                        <img
                          alt="pass_icon"
                          className="h-4 w-4"
                          src={PasswordIconSVG}
                        />
                      )}
                    </button>
                  </div>
                  {errDetails.confirmPassword_err && (
                    <ErrorSpan
                      className="text-xs text-red-600"
                      message={errDetails.confirmPassword_err}
                    />
                  )}
                </div>
              </div>
              <Button
                className="text-sm"
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
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);

export default StaticPage;
