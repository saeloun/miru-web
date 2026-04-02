import React from "react";

import dayjs from "dayjs";
import { CalendarIcon, DeleteIcon, ProjectsIcon } from "miruIcons";
import "react-phone-number-input/style.css";
import { Button } from "StyledComponents";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";

const inputClass =
  "form__input block h-12 w-full appearance-none bg-background p-4 text-sm focus-within:border-primary";

const labelClass =
  "absolute top-0.5 left-1 z-1 h-6 origin-0 bg-background p-2 text-sm font-medium duration-300";

const MobileEmploymentEditor = ({
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
  handleUpdateDetails,
  handleCancelDetails,
}) => {
  const getDOJ = joinedAt && dayjs(joinedAt, dateFormat).format(dateFormat);

  const getDOR = resignedAt && dayjs(resignedAt, dateFormat).format(dateFormat);

  return (
    <div className="h-full bg-muted p-4">
      <div className="border-b border-b-border py-10">
        <div className="mt-2 flex w-full">
          <ProjectsIcon
            className="mr-4 mt-1 text-foreground"
            size={16}
            weight="bold"
          />
          <span className="text-sm font-medium text-foreground">
            Current Employment
          </span>
        </div>
        <div className="w-full">
          <div className="mt-6 flex w-full flex-col px-2">
            <CustomInputText
              id="employee_id"
              label="Employee ID"
              name="employee_id"
              type="text"
              value={employmentDetails.current_employment.employee_id}
              inputBoxClassName={`${inputClass} ${
                errDetails.employee_id_err
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.employee_id_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e => {
                updateCurrentEmploymentDetails(e.target.value, "employee_id");
              }}
            />
            {errDetails.employee_id_err && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.employee_id_err}
              />
            )}
          </div>
          <div className="w- mt-6 flex flex-col px-2">
            <CustomInputText
              id="designation"
              label="Designation"
              name="designation"
              type="text"
              value={employmentDetails.current_employment.designation}
              inputBoxClassName={`${inputClass} ${
                errDetails.designation_err
                  ? "border-destructive"
                  : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.designation_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e => {
                updateCurrentEmploymentDetails(e.target.value, "designation");
              }}
            />
            {errDetails.designation_err && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.designation_err}
              />
            )}
          </div>
          <div className="mt-6 flex w-full flex-col px-2">
            <CustomInputText
              disabled={employmentDetails.current_employment.email}
              id="email"
              label="Email ID (Official)"
              name="email"
              type="text"
              value={employmentDetails.current_employment.email}
              inputBoxClassName={`${inputClass} ${
                errDetails.email_err ? "border-destructive" : "border-border"
              }`}
              labelClassName={`${labelClass} ${
                errDetails.email_err
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              onChange={e => {
                updateCurrentEmploymentDetails(e.target.value, "email");
              }}
            />
            {errDetails.email_err && (
              <ErrorSpan
                className="text-xs text-destructive"
                message={errDetails.email_err}
              />
            )}
          </div>
          <div className="mt-6 flex w-full flex-col px-2">
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
                className="text-xs text-destructive"
                message={errDetails.employment_err}
              />
            )}
          </div>
          <div className="mt-6 flex w-full flex-col" ref={DOJRef}>
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
                color="#5E58F1"
                size={20}
              />
            </div>
            {errDetails.joined_at_err && (
              <ErrorSpan
                className="text-xs text-destructive"
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
          <div className="mt-6 flex w-full flex-col" ref={DORRef}>
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
                color="#5E58F1"
                size={20}
              />
            </div>
            {errDetails.resigned_at_err && (
              <ErrorSpan
                className="text-xs text-destructive"
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
      <div className="border-b border-b-border py-10">
        <div className="mt-2 flex w-full">
          <ProjectsIcon
            className="mr-4 mt-1 text-foreground"
            size={16}
            weight="bold"
          />
          <span className="text-sm font-medium text-foreground">
            Previous Employment
          </span>
        </div>
        <div className="mt-6 w-full">
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
                  className="rounded p-1vh hover:bg-muted"
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
      <div className="mt-10 flex items-center justify-between gap-x-2 p-4">
        <div className="w-1/2 text-center">
          <Button
            className="w-full"
            style="secondary"
            onClick={handleCancelDetails}
          >
            Cancel
          </Button>
        </div>
        <div className="w-1/2 text-center">
          <Button className="w-full" onClick={handleUpdateDetails}>
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileEmploymentEditor;
