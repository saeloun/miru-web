/* eslint-disable no-unused-vars */
import React from "react";

import {
  InfoIcon,
  PasswordIconSVG,
  PasswordIconTextSVG,
  KeyIcon,
} from "miruIcons";
import "react-phone-number-input/style.css";

import { CustomInputText } from "common/CustomInputText";
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
  currentCountryDetails,
  updatedStates,
  promiseOptions,
  handleOnChangeState,
  updateBasicDetails,
  personalDetails,
  showDatePicker,
  setShowDatePicker,
  handleDatePicker,
  errDetails,
  handleOnChangeCity,
  handlePhoneNumberChange,
  wrapperRef,
  changePassword,
  setChangePassword,
  showCurrentPassword,
  currentPassword,
  handleCurrentPasswordChange,
  setShowCurrentPassword,
  getErr,
  showConfirmPassword,
  showPassword,
  handlePasswordChange,
  password,
  confirmPassword,
  setShowPassword,
  handleConfirmPasswordChange,
  setShowConfirmPassword,
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
              value={personalDetails.first_name}
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
              value={personalDetails.last_name}
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
                  onClick={() => setChangePassword(false)}
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
