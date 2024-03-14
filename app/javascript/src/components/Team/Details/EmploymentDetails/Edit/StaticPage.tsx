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
  previousEmployments,
  handleDeletePreviousEmployment,
  handleAddPastEmployment,
  updatePreviousEmploymentValues,
  dateFormat,
  joinedAt,
  resignedAt,
}) => {
  const getDOJ = joinedAt && dayjs(joinedAt, dateFormat).format(dateFormat);

  const getDOR = resignedAt && dayjs(resignedAt, dateFormat).format(dateFormat);

  return (
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
                  errDetails.employee_id_err
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
              {errDetails.designation_err && (
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
                disabled={employmentDetails.current_employment.email}
                id="email"
                label="Email ID (Official)"
                name="email"
                type="text"
                value={employmentDetails.current_employment.email}
                inputBoxClassName={`${inputClass} ${
                  errDetails.email_err
                    ? "border-red-600"
                    : "border-miru-gray-1000"
                }`}
                labelClassName={`${labelClass} ${
                  errDetails.email_err
                    ? "text-red-600"
                    : "text-miru-dark-purple-200"
                }`}
                onChange={e => {
                  updateCurrentEmploymentDetails(e.target.value, "email");
                }}
              />
              {errDetails.email_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.email_err}
                />
              )}
            </div>
            <div className="flex w-1/2 flex-col px-2">
              <CustomReactSelect
                handleOnChange={handleOnChangeEmployeeType}
                id="employment_type"
                label="Employment Type"
                name="employment_type"
                options={employeeTypes}
                value={employeeType?.value ? employeeType : employeeTypes[0]}
              />
              {errDetails.employment_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.employment_err}
                />
              )}
            </div>
          </div>
          <div className="flex flex-row py-3">
            <div className="flex w-1/2 flex-col" ref={DOJRef}>
              <div
                className="field relative flex w-full flex-col px-2"
                id="joiningDate"
                onClick={() =>
                  setShowDOJDatePicker({
                    visibility: !showDOJDatePicker.visibility,
                  })
                }
              >
                <CustomInputText
                  disabled
                  id="joined_at"
                  label="Date of Joining"
                  name="joined_at"
                  type="text"
                  value={getDOJ || ""}
                />
                <CalendarIcon
                  className="absolute top-0 bottom-0 right-4 my-auto"
                  color="#5B34EA"
                  size={20}
                />
              </div>
              {errDetails.joined_at_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.joined_at_err}
                />
              )}
              {showDOJDatePicker.visibility && (
                <CustomDatePicker
                  date={joinedAt || dayjs()}
                  dateFormat={dateFormat}
                  handleChange={handleDOJDatePicker}
                />
              )}
            </div>
            <div className="flex w-1/2 flex-col" ref={DORRef}>
              <div
                className="field relative flex w-full flex-col px-2"
                id="resigningDate"
                onClick={() =>
                  setShowDORDatePicker({
                    visibility: !showDORDatePicker.visibility,
                  })
                }
              >
                <CustomInputText
                  disabled
                  id="resigned_at"
                  label="Date of Resignation"
                  name="resigned_at"
                  type="text"
                  value={getDOR || ""}
                />
                <CalendarIcon
                  className="absolute top-0 bottom-0 right-4 my-auto"
                  color="#5B34EA"
                  size={20}
                />
              </div>
              {errDetails.resigned_at_err && (
                <ErrorSpan
                  className="text-xs text-red-600"
                  message={errDetails.resigned_at_err}
                />
              )}
              {showDORDatePicker.visibility && (
                <CustomDatePicker
                  date={resignedAt || dayjs()}
                  dateFormat={dateFormat}
                  handleChange={handleDORDatePicker}
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
        <div className="w-10/12">
          {previousEmployments.length > 0 &&
            previousEmployments.map((previous, index) => (
              <div
                className="mb-6 flex w-full flex-row items-center justify-between"
                key={index}
              >
                <div className="flex w-full flex-row">
                  <div className="flex w-1/2 flex-col px-2">
                    <CustomInputText
                      id={`company_name_${index}`}
                      label="Company Name"
                      name="company_name"
                      type="text"
                      value={previous.company_name}
                      onChange={e => {
                        updatePreviousEmploymentValues(previous, e);
                      }}
                    />
                  </div>
                  <div className="flex w-1/2 flex-col px-2">
                    <CustomInputText
                      id={`role_${index}`}
                      label="Role"
                      name="role"
                      type="text"
                      value={previous.role}
                      onChange={e => {
                        updatePreviousEmploymentValues(previous, e);
                      }}
                    />
                  </div>
                </div>
                <Button
                  className="rounded p-1vh hover:bg-miru-dark-purple-100"
                  style="ternary"
                  onClick={() => handleDeletePreviousEmployment(previous)}
                >
                  <DeleteIcon size={16} weight="bold" />
                </Button>
              </div>
            ))}
          <div className="flex items-center justify-between">
            <Button
              className="ml-2 w-full py-3"
              style="dashed"
              onClick={handleAddPastEmployment}
            >
              + Add Past Employment
            </Button>
            <div className="w-11" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
