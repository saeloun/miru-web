import React from "react";

import dayjs from "dayjs";
import { ProjectsIcon, CalendarIcon, DeleteIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";

const inputClass =
  "form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000";

const labelClass =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300";

const StaticPage = ({
  employeeTypes,
  employeeType,
  handleOnChangeEmployeeType,
  updateCurrentEmploymentDetails,
  employmentDetails,
  showDORDatePicker,
  showDOJDatePicker,
  setShowDOJDatePicker,
  setShowDORDatePicker,
  handleDOJDatePicker,
  handleDORDatePicker,
  errDetails,
  DOJRef,
  DORRef,
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-1/5 pr-4">
        <ProjectsIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Current <br /> Employment
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row py-3">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="employee_id"
              label="Employee ID"
              name="employee_id"
              type="text"
              value={employmentDetails.current_employment.employee_id}
              inputBoxClassName={`${inputClass} ${
                errDetails.first_name_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.employee_id_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
              onChange={e => {
                updateCurrentEmploymentDetails(e.target.value, "employee_id");
              }}
            />
            {errDetails.employee_id_err && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.employee_id_err}
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="designation"
              label="Designation"
              name="designation"
              type="text"
              value={employmentDetails.current_employment.designation}
              inputBoxClassName={`${inputClass} ${
                errDetails.designation_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.designation_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
              onChange={e => {
                updateCurrentEmploymentDetails(e.target.value, "designation");
              }}
            />
            {errDetails.last_name_err && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.designation_err}
              />
            )}
          </div>
        </div>
        <div className="flex flex-row py-3">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="email_id"
              label="Email ID (Official)"
              name="email_id"
              type="text"
              value={employmentDetails.current_employment.email_id}
              inputBoxClassName={`${inputClass} ${
                errDetails.email_id_err
                  ? "border-red-600"
                  : "border-miru-gray-1000"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.email_id_err
                  ? "text-red-600"
                  : "text-miru-dark-purple-200"
              }`}
              onChange={e => {
                updateCurrentEmploymentDetails(e.target.value, "email_id");
              }}
            />
            {errDetails.email_id_err && (
              <ErrorSpan
                className="text-xs text-red-600"
                message={errDetails.first_name_err}
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomReactSelect
              handleOnChange={handleOnChangeEmployeeType}
              label="Employment Type"
              name="employment_type"
              options={employeeTypes}
              value={employeeType.value ? employeeType : employeeTypes[0]}
            />
          </div>
        </div>
        <div className="flex flex-row py-3">
          <div className="flex w-1/2 flex-col" ref={DOJRef}>
            <div
              className="field relative flex w-full flex-col px-2"
              onClick={() =>
                setShowDOJDatePicker({
                  visibility: !showDOJDatePicker.visibility,
                })
              }
            >
              <CustomInputText
                disabled
                id="date_of_joining"
                label="Date of Joining"
                name="date_of_joining"
                type="text"
                value={
                  employmentDetails.current_employment.date_of_joining || ""
                }
                onChange={e => {
                  updateCurrentEmploymentDetails(
                    e.target.value,
                    "date_of_joining"
                  );
                }}
              />
              <CalendarIcon
                className="absolute top-0 bottom-0 right-4"
                color="#5B34EA"
                size={20}
              />
            </div>
            {showDOJDatePicker.visibility && (
              <CustomDatePicker
                dateFormat="DD-MM-YYYY"
                handleChange={e => handleDOJDatePicker(e, true)}
                date={
                  employmentDetails.current_employment.date_of_joining
                    ? employmentDetails.current_employment.date_of_joining
                    : dayjs()
                }
              />
            )}
          </div>
          <div className="flex w-1/2 flex-col" ref={DORRef}>
            <div
              className="field relative flex w-full flex-col px-2"
              onClick={() =>
                setShowDORDatePicker({
                  visibility: !showDORDatePicker.visibility,
                })
              }
            >
              <CustomInputText
                disabled
                id="date_of_resignation"
                label="Date of Resignation"
                name="date_of_resignation"
                type="text"
                value={
                  employmentDetails.current_employment.date_of_resignation || ""
                }
                onChange={e => {
                  updateCurrentEmploymentDetails(
                    e.target.value,
                    "date_of_resignation"
                  );
                }}
              />
              <CalendarIcon
                className="absolute top-0 bottom-0 right-4"
                color="#5B34EA"
                size={20}
              />
            </div>
            {showDORDatePicker.visibility && (
              <CustomDatePicker
                dateFormat="DD-MM-YYYY"
                handleChange={e => handleDORDatePicker(e, true)}
                date={
                  employmentDetails.current_employment.date_of_resignation
                    ? employmentDetails.current_employment.date_of_resignation
                    : dayjs()
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-1/5 pr-4">
        <ProjectsIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Previous <br /> Employment
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="Role"
              label="Role"
              name="Role"
              type="text"
              value=""
              onChange={e => {}} // eslint-disable-line
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              id="Company Name"
              label="Company Name"
              name="Company Name"
              type="text"
              value=""
              onChange={e => {}} // eslint-disable-line
            />
          </div>
          <Button className="rounded" style="ternary">
            <DeleteIcon
              className="text-miru-han-purple-1000"
              size={16}
              weight="bold"
            />
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
