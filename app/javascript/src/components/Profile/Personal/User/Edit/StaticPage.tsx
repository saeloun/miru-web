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
import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { Divider } from "common/Divider";
import { ErrorSpan } from "common/ErrorSpan";

const inputClass =
  "form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000";

const labelClass =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300";

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
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-2/12 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <InfoIcon className="mr-2" color="#1D1A31" size={13.5} /> Basic
          Details
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row pb-3">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="first_name"
              label="First name"
              name="first_name"
              type="text"
              value={personalDetails.first_name || ""}
              inputBoxClassName={`${inputClass} ${
                errDetails.first_name_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.first_name_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
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
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="last_name"
              label="Last name"
              name="last_name"
              type="text"
              value={personalDetails.last_name || ""}
              inputBoxClassName={`${inputClass} ${
                errDetails.last_name_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.last_name_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
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
        <div className="flex w-1/2 flex-col py-3" ref={wrapperRef}>
          <div
            className="field relative flex w-full flex-col px-2"
            onClick={() => {
              setShowDatePicker({ visibility: !showDatePicker.visibility });
            }}
          >
            <CustomInputText
              disabled
              id="date_of_birth"
              inputBoxClassName={`${inputClass} border-miru-gray-1000`}
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
      </div>
    </div>
    <Divider />
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-2/12 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <PhoneIcon className="mr-2" color="#1D1A31" size={13.5} />
          Contact Details
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white p-4">
              <PhoneInput
                className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                flags={flags}
                inputclassname="form__input block w-full appearance-none bg-white border-0 focus:border-0 px-0 text-base border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full border-bottom-none "
                value={
                  personalDetails.phone_number
                    ? personalDetails.phone_number
                    : ""
                }
                onChange={handlePhoneNumberChange}
              />
              <label
                className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300"
                htmlFor="phone_number"
              >
                Phone number
              </label>
            </div>
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="email_id"
              label="Email ID (Personal)"
              name="email_id"
              type="email"
              value={personalDetails.email_id || ""}
              inputBoxClassName={`${inputClass} ${
                errDetails.email_id_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.email_id_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              } `}
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
      </div>
    </div>
    <Divider />
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-2/12 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <MapPinIcon className="mr-2" color="#1D1A31" size={13.5} />
          Address
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomReactSelect
              handleOnChange={handleOnChangeAddrType}
              label="Address type"
              name="address_select"
              options={addressOptions}
              value={addrType.value ? addrType : addressOptions[0]}
            />
          </div>
        </div>
        <div className="flex w-full flex-col px-2 py-3">
          <CustomInputText
            id="address_line_1"
            label="Address line 1"
            name="address_line_1"
            type="text"
            inputBoxClassName={`${inputClass} ${
              errDetails.address_line_1_err
                ? "border-red-600"
                : "border-miru-gray-1000"
            }`}
            labelClassName={`${labelClass} ${
              errDetails.address_line_1_err
                ? "text-red-600"
                : "text-miru-dark-purple-200"
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
              className="text-xs text-red-600"
              message={errDetails.address_line_1_err}
            />
          )}
        </div>
        <div className="flex w-full flex-col px-2 py-3">
          <CustomInputText
            id="address_line_2"
            label="Address line 2 (optional)"
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
                className="text-xs text-red-600"
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
                errDetails.state_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.state_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
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
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2 py-3">
            <CustomInputText
              id="city"
              label="City"
              name="city"
              type="text"
              value={personalDetails.addresses.city}
              inputBoxClassName={`${inputClass} ${
                errDetails.city_err ? "border-red-600" : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.city_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
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
          <div className="flex w-1/2 flex-col px-2 py-3">
            <CustomInputText
              id="zipcode"
              label="Zipcode"
              name="zipcode"
              type="text"
              value={personalDetails.addresses.pin}
              inputBoxClassName={`${inputClass} ${
                errDetails.pin_err ? "border-red-600" : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.pin_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
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
      </div>
    </div>
    <div className="flex py-10">
      <div className="w-2/12 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <GlobeIcon className="mr-2" color="#1D1A31" size={13.5} />
          Social Profiles
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="linked_in"
              label="LinkedIn"
              name="linked_in"
              type="text"
              value={personalDetails.linkedin}
              onChange={e => {
                updateBasicDetails(e.target.value, "linkedin", false);
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="github"
              label="Github"
              name="github"
              type="text"
              value={personalDetails.github}
              onChange={e => {
                updateBasicDetails(e.target.value, "github", false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-row py-6">
      <div className="w-2/12 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <KeyIcon className="mr-2" color="#1D1A31" size={13.5} />
          Password
        </span>
      </div>
      <div className="w-9/12">
        <div>
          {!changePassword && (
            <div className="ml-2">
              <button
                className="cursor-pointer rounded border border-miru-han-purple-600 p-1 text-xs font-bold text-miru-han-purple-600"
                onClick={() => setChangePassword(true)}
              >
                Change Password
              </button>
            </div>
          )}
          {changePassword && (
            <div>
              <div className="flex flex-col">
                <div className="relative flex w-1/2 flex-col px-2 py-3">
                  <CustomInputText
                    id="current_password"
                    label="Current Password"
                    name="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={personalDetails.currentPassword}
                    inputBoxClassName={`${inputClass} ${
                      errDetails.currentPassword_err
                        ? "border-red-600"
                        : "border-miru-gray-1000"
                    }`}
                    labelClassName={`${labelClass} ${
                      errDetails.currentPassword_err
                        ? "text-red-600"
                        : "text-miru-dark-purple-200"
                    }`}
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
                      className="text-xs text-red-600"
                      message={errDetails.currentPassword_err}
                    />
                  )}
                </div>
                <div className="flex flex-row py-3">
                  <div className="relative flex w-1/2 flex-col px-2">
                    <CustomInputText
                      id="password"
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={personalDetails.password}
                      inputBoxClassName={`${inputClass} ${
                        errDetails.password_err
                          ? "border-red-600"
                          : "border-miru-gray-1000"
                      }`}
                      labelClassName={`${labelClass} ${
                        errDetails.password_err
                          ? "text-red-600"
                          : "text-miru-dark-purple-200"
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
                        className="text-xs text-red-600"
                        message={errDetails.password_err}
                      />
                    )}
                  </div>
                  <div className="relative flex w-1/2 flex-col px-2">
                    <CustomInputText
                      id="confirm_password"
                      label="Confirm Password"
                      name="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={personalDetails.confirmPassword}
                      inputBoxClassName={`${inputClass} ${
                        errDetails.confirmPassword_err
                          ? "border-red-600"
                          : "border-miru-gray-1000"
                      }`}
                      labelClassName={`${labelClass} ${
                        errDetails.confirmPassword_err
                          ? "text-red-600"
                          : "text-miru-dark-purple-200"
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
                        className="text-xs text-red-600"
                        message={errDetails.confirmPassword_err}
                      />
                    )}
                  </div>
                </div>
                <p
                  className="ml-2 mt-2 cursor-pointer text-miru-han-purple-1000"
                  onClick={() => {
                    setErrDetails({
                      ...errDetails,
                      password_err: "",
                      confirmPassword_err: "",
                    });
                    cancelPasswordChange();
                  }}
                >
                  CANCEL
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
