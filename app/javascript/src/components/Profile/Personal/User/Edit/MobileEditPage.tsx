import React from "react";

import dayjs from "dayjs";
import {
  CalendarIcon,
  GlobeIcon,
  InfoIcon,
  KeyIcon,
  MapPinIcon,
  PasswordIconSVG,
  PasswordIconTextSVG,
  PhoneIcon,
} from "miruIcons";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";
import { Divider } from "common/Divider";
import { ErrorSpan } from "common/ErrorSpan";
import PasskeysPanel from "./PasskeysPanel";
import TotpPanel from "./TotpPanel";

const inputClass =
  "form__input block h-12 w-full appearance-none bg-background p-4 text-sm focus-within:border-primary";

const labelClass =
  "absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-sm font-medium duration-300";

const MobileEditDetails = ({
  avatarSection,
  addrType,
  addressOptions,
  changePassword,
  countries,
  handleOnChangeAddrType,
  handleOnChangeCountry,
  handleCancelDetails,
  handleUpdateDetails,
  updateBasicDetails,
  personalDetails,
  setChangePassword,
  setShowConfirmPassword,
  setShowCurrentPassword,
  setShowDatePicker,
  setShowPassword,
  showConfirmPassword,
  showCurrentPassword,
  showDatePicker,
  showPassword,
  handleDatePicker,
  errDetails,
  handlePhoneNumberChange,
  wrapperRef,
  dateFormat,
  cancelPasswordChange,
  setErrDetails,
  handleCurrentPasswordChange,
  currentPassword,
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
}) => {
  const handlePasswordChange = () => {
    if (changePassword) {
      cancelPasswordChange();
      setErrDetails({
        ...errDetails,
        password_err: "",
        confirmPassword_err: "",
      });
    } else {
      setChangePassword(true);
    }
  };

  return (
    <div className="mt-12 px-4 py-2">
      {avatarSection && <div className="pb-4">{avatarSection}</div>}
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <InfoIcon className="mr-2" color="#1D1A31" size={13.5} /> Basic
          Details
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <CustomInputText
              id="first_name"
              label="First name"
              name="first_name"
              type="text"
              value={personalDetails.first_name}
              inputBoxClassName={`${inputClass} ${
                errDetails.first_name_err
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.first_name_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e => {
                updateBasicDetails(e.target.value, "first_name", false, "");
              }}
            />
            {errDetails.first_name_err && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.first_name_err}
              />
            )}
          </div>
          <div className="w-1/2 px-1">
            <CustomInputText
              id="last_name"
              label="Last name"
              name="last_name"
              type="text"
              value={personalDetails.last_name}
              inputBoxClassName={`${inputClass} ${
                errDetails.last_name_err
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.last_name_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e => {
                updateBasicDetails(e.target.value, "last_name", false, "");
              }}
            />
            {errDetails.last_name_err && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.last_name_err}
              />
            )}
          </div>
        </div>
        <div className="mt-2 flex w-full flex-row">
          <div className="flex w-1/2 flex-col py-3" ref={wrapperRef}>
            <div
              className="field relative flex w-full flex-col px-2"
              onClick={() =>
                setShowDatePicker({ visibility: !showDatePicker.visibility })
              }
            >
              <CustomInputText
                readOnly
                id="date_of_birth"
                inputBoxClassName={`${inputClass} border-border`}
                label="Date of Birth"
                name="date_of_birth"
                type="text"
                value={personalDetails.date_of_birth || ""}
                onChange={e => {
                  updateBasicDetails(e.target.value, "date_of_birth", false);
                }}
              />
              <CalendarIcon
                className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                color="#5E58F1"
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
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <PhoneIcon className="mr-2" color="#1D1A31" size={13.5} /> Contact
          Details
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <div className="outline relative flex h-12 flex-row rounded border border-border bg-background px-2 pb-4 pt-2 text-sm">
              <PhoneInput
                className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                flags={flags}
                value={
                  personalDetails.phone_number
                    ? personalDetails.phone_number
                    : ""
                }
                onChange={handlePhoneNumberChange}
              />
              <label
                className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-background px-1 text-xsm font-medium text-muted-foreground duration-300"
                htmlFor="phone_number"
              >
                Phone number
              </label>
            </div>
          </div>
          <div className="w-1/2 px-1">
            <CustomInputText
              id="email_id"
              label="Email ID (Personal)"
              name="email_id"
              type="email"
              value={personalDetails.email_id}
              inputBoxClassName={`${inputClass} ${
                errDetails.email_id_err ? "border-destructive" : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.email_id_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              } `}
              onChange={e => {
                updateBasicDetails(e.target.value, "email_id", false);
              }}
            />
            {errDetails.email_id_err && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.email_id_err}
              />
            )}
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <MapPinIcon className="mr-2" color="#1D1A31" size={13.5} /> Address
        </span>
        <div className="mt-2 flex w-full flex-col">
          <div className="px-1 py-1">
            <CustomReactSelect
              handleOnChange={handleOnChangeAddrType}
              label="Address type"
              name="address_select"
              options={addressOptions}
              value={addrType.value ? addrType : addressOptions[0]}
            />
          </div>
          <div className="px-1 py-1">
            <CustomInputText
              id="address_line_1"
              label="Address line 1"
              name="address_line_1"
              type="text"
              inputBoxClassName={`${inputClass} ${
                errDetails.address_line_1_err
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.address_line_1_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
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
                className="text-xs text-destructive"
                message={errDetails.address_line_1_err}
              />
            )}
          </div>
          <div className="px-2 py-1">
            <CustomInputText
              id="address_line_2"
              inputBoxClassName={`${inputClass} border-border`}
              label="Address line 2 (optional)"
              labelClassName={`${labelClass} text-muted-foreground`}
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
          <div className="flex flex-row">
            <div className="flex w-1/2 flex-col px-2 py-3">
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
                  className="text-xs text-destructive"
                  message={errDetails.country_err}
                />
              )}
            </div>
            <div className="flex w-1/2 flex-col px-2 py-3">
              <CustomInputText
                id="state"
                label="State"
                name="state"
                type="text"
                value={personalDetails.addresses.state}
                inputBoxClassName={`${inputClass} ${
                  errDetails.state_err ? "border-destructive" : "border-border"
                }`}
                labelClassName={`${labelClass} ${
                  errDetails.state_err
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
                onChange={e => {
                  updateBasicDetails(e.target.value, "state", true);
                }}
              />
              {errDetails.state_err && (
                <ErrorSpan
                  className="text-xs text-destructive"
                  message={errDetails.state_err}
                />
              )}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="flex w-1/2 flex-col px-2 py-3">
              <CustomInputText
                id="city"
                label="City"
                name="city"
                type="text"
                value={personalDetails.addresses.city}
                inputBoxClassName={`${inputClass} ${
                  errDetails.city_err ? "border-destructive" : "border-border"
                }`}
                labelClassName={`${labelClass} ${
                  errDetails.city_err
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
                onChange={e => {
                  updateBasicDetails(e.target.value, "city", true);
                }}
              />
              {errDetails.city_err && (
                <ErrorSpan
                  className="text-xs text-destructive"
                  message={errDetails.city_err}
                />
              )}
            </div>
            <div className="flex w-1/2 flex-col px-2 py-3">
              <CustomInputText
                id="zipcode"
                label="Zipcode"
                name="zipcode"
                type="text"
                value={personalDetails.addresses.pin}
                inputBoxClassName={`${inputClass} ${
                  errDetails.pin_err ? "border-destructive" : "border-border"
                }`}
                labelClassName={`${labelClass} ${
                  errDetails.pin_err
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
                onChange={e => {
                  updateBasicDetails(e.target.value, "pin", true);
                }}
              />
              {errDetails.pin_err && (
                <ErrorSpan
                  className="text-xs text-destructive"
                  message={errDetails.pin_err}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <GlobeIcon className="mr-2" color="#1D1A31" size={13.5} />
          Social Profiles
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="flex w-1/2 flex-col px-1">
            <CustomInputText
              id="linkedin"
              inputBoxClassName={`${inputClass} border-border`}
              label="LinkedIn"
              labelClassName={`${labelClass} text-muted-foreground`}
              name="linkedin"
              type="text"
              value={personalDetails.linkedin}
              onChange={e => {
                updateBasicDetails(e.target.value, "linkedin", false, "");
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col px-1">
            <CustomInputText
              id="github"
              inputBoxClassName={`${inputClass} border-border`}
              label="Github"
              labelClassName={`${labelClass} text-muted-foreground`}
              name="github"
              type="text"
              value={personalDetails.github}
              onChange={e => {
                updateBasicDetails(e.target.value, "github", false, "");
              }}
            />
          </div>
        </div>
      </div>
      <div className="py-6">
        <div className="flex items-center justify-between pr-4">
          <span className="flex flex-row items-center text-sm font-medium text-foreground">
            <KeyIcon className="mr-2" color="#1D1A31" size={13.5} />
            Password
          </span>
          <div className="ml-2">
            <button
              className="cursor-pointer p-1 text-xs font-bold text-primary"
              onClick={handlePasswordChange}
            >
              {changePassword ? "Cancel Password" : "Change Password"}
            </button>
          </div>
        </div>
        <div>
          <div className="mt-2">
            {changePassword && (
              <div>
                <div className="relative flex flex-col px-2 py-3">
                  <CustomInputText
                    id="current_password"
                    label="Current Password"
                    name="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    inputBoxClassName={`${inputClass} ${
                      errDetails.currentPassword_err
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    labelClassName={`${labelClass} ${
                      errDetails.currentPassword_err
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                    onChange={handleCurrentPasswordChange}
                  />
                  <button
                    className="btn btn-outline-primary absolute right-0 mt-4 mr-5"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {!showCurrentPassword ? (
                      <img alt="pass_icon" src={PasswordIconSVG} />
                    ) : (
                      <img alt="pass_icon_text" src={PasswordIconTextSVG} />
                    )}
                  </button>
                  {errDetails.currentPassword_err && (
                    <ErrorSpan
                      className="text-xs text-destructive"
                      message={errDetails.currentPassword_err}
                    />
                  )}
                </div>
                <div className="py-3">
                  <div className="relative flex flex-col px-2">
                    <CustomInputText
                      id="password"
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={personalDetails.password}
                      inputBoxClassName={`${inputClass} ${
                        errDetails.password_err
                          ? "border-destructive"
                          : "border-border"
                      }`}
                      labelClassName={`${labelClass} ${
                        errDetails.password_err
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
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
                      className="btn btn-outline-primary absolute right-0 mt-4 mr-5"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {!showPassword ? (
                        <img alt="pass_icon" src={PasswordIconSVG} />
                      ) : (
                        <img alt="pass_icon_text" src={PasswordIconTextSVG} />
                      )}
                    </button>
                    {errDetails.password_err && (
                      <ErrorSpan
                        className="text-xs text-destructive"
                        message={errDetails.password_err}
                      />
                    )}
                  </div>
                  <div className="py-3">
                    <div className="relative flex flex-col px-2">
                      <CustomInputText
                        id="confirm_password"
                        label="Confirm Password"
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={personalDetails.confirmPassword}
                        inputBoxClassName={`${inputClass} ${
                          errDetails.confirmPassword_err
                            ? "border-destructive"
                            : "border-border"
                        }`}
                        labelClassName={`${labelClass} ${
                          errDetails.confirmPassword_err
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
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
                        className="btn btn-outline-primary absolute right-0 mt-4 mr-5"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {!showConfirmPassword ? (
                          <img alt="pass_icon" src={PasswordIconSVG} />
                        ) : (
                          <img alt="pass_icon_text" src={PasswordIconTextSVG} />
                        )}
                      </button>
                      {errDetails.confirmPassword_err && (
                        <ErrorSpan
                          className="text-xs text-destructive"
                          message={errDetails.confirmPassword_err}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PasskeysPanel
        busy={passkeysBusy}
        canManage={canManagePasskeys}
        onRegister={onRegisterPasskey}
        onRemove={onRemovePasskey}
        onToggleRequirement={onTogglePasskeyRequirement}
        passkeyRequiredForLogin={passkeyRequiredForLogin}
        passkeys={passkeys}
      />
      <div className="mt-6">
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
      <Divider />
      <div className="flex flex-row justify-between py-4">
        <button
          className="h-10	 w-38 rounded border border-primary bg-transparent py-2 px-6 text-xs font-bold tracking-widest text-primary "
          onClick={handleCancelDetails}
        >
          CANCEL
        </button>
        <button
          className="h-10 w-38 rounded border border-primary bg-primary px-6 py-2 text-xs font-bold tracking-widest text-primary-foreground"
          onClick={handleUpdateDetails}
        >
          SAVE
        </button>
      </div>
    </div>
  );
};

export default MobileEditDetails;
