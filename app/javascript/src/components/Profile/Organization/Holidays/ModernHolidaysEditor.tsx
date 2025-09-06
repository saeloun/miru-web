import React from "react";
import dayjs from "dayjs";
import {
  Calendar,
  Plus,
  Trash,
  Gift,
  CalendarPlus,
  ToggleLeft,
  ToggleRight,
} from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Separator } from "../../../ui/separator";
import CustomReactSelect from "common/CustomReactSelect";
import SingleYearDatePicker from "common/CustomYearPicker/SingleYearDatePicker";
import { allocationFrequency } from "constants/leaveType";
import { customStyles } from "./EditHolidays/utils";

const ModernHolidaysEditor = ({
  isDesktop,
  dateFormat,
  currentYear,
  setCurrentYear,
  enableOptionalHolidays,
  setEnableOptionalHolidays,
  holidayList,
  optionalHolidaysList,
  totalOptionalHolidays,
  isDisableUpdateBtn,
  optionalRepetitionType,
  wrapperRef,
  optionalWrapperRef,
  showDatePicker,
  setShowDatePicker,
  showOptionalDatePicker,
  setShowOptionalDatePicker,
  handleAddHoliday,
  handleCancelAction,
  handleChangeRepetitionOpHoliday,
  handleChangeTotalOpHoliday,
  handleCheckboxClick,
  handleDatePicker,
  handleDeleteHoliday,
  handleHolidateNameChange,
  updateHolidayDetails,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-geist-semibold text-gray-900">
                Holiday Management
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-geist-regular">
                Configure public and optional holidays for {currentYear}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Year Selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Calendar size={16} className="text-gray-600" weight="bold" />
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="bg-transparent border-none focus:outline-none font-geist-medium text-sm"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
              <Button
                onClick={handleCancelAction}
                variant="outline"
                className="font-geist-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={updateHolidayDetails}
                disabled={isDisableUpdateBtn}
                className="bg-miru-han-purple-600 hover:bg-miru-han-purple-700 text-white font-geist-medium"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Public Holidays */}
          <div className="lg:col-span-2">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-gray-600" weight="bold" />
                  Public Holidays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {holidayList.length > 0 ? (
                    <>
                      {holidayList.map((holiday, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="relative">
                              <Label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider mb-1">
                                Date
                              </Label>
                              <div
                                className="relative cursor-pointer"
                                onClick={() => {
                                  setShowDatePicker({
                                    visibility: !showDatePicker.visibility,
                                    index,
                                  });
                                }}
                              >
                                <Input
                                  readOnly
                                  className="font-geist-regular cursor-pointer pr-10"
                                  placeholder="Select date"
                                  value={holiday.date}
                                />
                                <Calendar
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-miru-han-purple-600"
                                  size={16}
                                  weight="bold"
                                />
                              </div>
                              {index === showDatePicker.index &&
                                showDatePicker.visibility && (
                                  <div className="absolute z-10 mt-1">
                                    <SingleYearDatePicker
                                      dateFormat={dateFormat}
                                      selectedYear={currentYear}
                                      setVisibility={showDatePicker.visibility}
                                      wrapperRef={wrapperRef}
                                      date={
                                        holiday.date ||
                                        dayjs().set("year", currentYear)
                                      }
                                      handleChange={(e) =>
                                        handleDatePicker(e, index, false)
                                      }
                                    />
                                  </div>
                                )}
                            </div>
                            <div>
                              <Label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider mb-1">
                                Holiday Name
                              </Label>
                              <Input
                                className="font-geist-regular"
                                placeholder="Enter holiday name"
                                value={holiday.name}
                                onChange={(e) =>
                                  handleHolidateNameChange(e, index, false)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(false, index)}
                            className="mt-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash size={16} weight="bold" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => handleAddHoliday(false)}
                        className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 font-geist-medium"
                      >
                        <Plus size={16} weight="bold" className="mr-2" />
                        Add Holiday
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Gift
                        size={48}
                        className="mx-auto mb-3 text-gray-300"
                        weight="thin"
                      />
                      <p className="text-gray-500 font-geist-regular mb-3">
                        No public holidays configured
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => handleAddHoliday(false)}
                        className="font-geist-medium"
                      >
                        <Plus size={16} weight="bold" className="mr-2" />
                        Add First Holiday
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optional Holidays */}
            <Card className="border-gray-200 shadow-sm mt-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-geist-semibold flex items-center gap-2">
                    <CalendarPlus
                      className="h-5 w-5 text-gray-600"
                      weight="bold"
                    />
                    Optional Holidays
                  </CardTitle>
                  <button
                    onClick={handleCheckboxClick}
                    className="transition-colors"
                  >
                    {enableOptionalHolidays ? (
                      <ToggleRight
                        size={32}
                        className="text-miru-han-purple-600"
                        weight="fill"
                      />
                    ) : (
                      <ToggleLeft
                        size={32}
                        className="text-gray-400"
                        weight="fill"
                      />
                    )}
                  </button>
                </div>
              </CardHeader>
              {enableOptionalHolidays && (
                <CardContent>
                  <div className="space-y-4">
                    {/* Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-gray-200">
                      <div>
                        <Label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                          Total Allowed
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          className="font-geist-regular mt-1"
                          placeholder="Enter number"
                          value={totalOptionalHolidays}
                          onChange={handleChangeTotalOpHoliday}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider">
                          Frequency
                        </Label>
                        <div className="mt-1">
                          <CustomReactSelect
                            handleOnChange={handleChangeRepetitionOpHoliday}
                            id="allocationFrequency"
                            label=""
                            name="allocationFrequency"
                            options={allocationFrequency}
                            styles={customStyles}
                            wrapperClassName="h-10"
                            components={{
                              IndicatorSeparator: () => null,
                            }}
                            value={
                              optionalRepetitionType
                                ? allocationFrequency.filter(
                                    (option) =>
                                      option.value === optionalRepetitionType
                                  )
                                : allocationFrequency[0]
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Optional Holiday List */}
                    <div className="space-y-3">
                      {optionalHolidaysList.length > 0 ? (
                        <>
                          {optionalHolidaysList.map(
                            (optionalHoliday, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="relative">
                                    <Label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider mb-1">
                                      Date
                                    </Label>
                                    <div
                                      className="relative cursor-pointer"
                                      onClick={() =>
                                        setShowOptionalDatePicker({
                                          visibility:
                                            !showOptionalDatePicker.visibility,
                                          index,
                                        })
                                      }
                                    >
                                      <Input
                                        readOnly
                                        className="font-geist-regular cursor-pointer pr-10"
                                        placeholder="Select date"
                                        value={optionalHoliday.date}
                                      />
                                      <Calendar
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-miru-han-purple-600"
                                        size={16}
                                        weight="bold"
                                      />
                                    </div>
                                    {index === showOptionalDatePicker.index &&
                                      showOptionalDatePicker.visibility && (
                                        <div className="absolute z-10 mt-1">
                                          <SingleYearDatePicker
                                            dateFormat={dateFormat}
                                            selectedYear={currentYear}
                                            wrapperRef={optionalWrapperRef}
                                            date={
                                              optionalHoliday.date ||
                                              dayjs().set("year", currentYear)
                                            }
                                            handleChange={(e) =>
                                              handleDatePicker(e, index, true)
                                            }
                                            setVisibility={
                                              showOptionalDatePicker.visibility
                                            }
                                          />
                                        </div>
                                      )}
                                  </div>
                                  <div>
                                    <Label className="text-xs font-geist-medium text-gray-500 uppercase tracking-wider mb-1">
                                      Holiday Name
                                    </Label>
                                    <Input
                                      className="font-geist-regular"
                                      placeholder="Enter holiday name"
                                      value={optionalHoliday.name}
                                      onChange={(e) =>
                                        handleHolidateNameChange(e, index, true)
                                      }
                                    />
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteHoliday(true, index)
                                  }
                                  className="mt-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash size={16} weight="bold" />
                                </Button>
                              </div>
                            )
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleAddHoliday(true)}
                            className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 font-geist-medium"
                          >
                            <Plus size={16} weight="bold" className="mr-2" />
                            Add Optional Holiday
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <CalendarPlus
                            size={36}
                            className="mx-auto mb-2 text-gray-300"
                            weight="thin"
                          />
                          <p className="text-sm text-gray-500 font-geist-regular mb-3">
                            No optional holidays configured
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddHoliday(true)}
                            className="font-geist-medium"
                          >
                            <Plus size={14} weight="bold" className="mr-1" />
                            Add Optional Holiday
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-geist-semibold">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-geist-regular">
                      Year
                    </span>
                    <span className="font-geist-semibold">{currentYear}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-geist-regular">
                      Public Holidays
                    </span>
                    <span className="font-geist-semibold">
                      {holidayList.length}
                    </span>
                  </div>
                  {enableOptionalHolidays && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-geist-regular">
                          Optional Holidays
                        </span>
                        <span className="font-geist-semibold">
                          {optionalHolidaysList.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-geist-regular">
                          Allowed per Employee
                        </span>
                        <span className="font-geist-semibold">
                          {totalOptionalHolidays || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-geist-semibold text-amber-900">
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-amber-800 space-y-2 font-geist-regular">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    Public holidays apply to all employees automatically
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    Optional holidays can be chosen by employees based on their
                    preference
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    Set the allocation frequency to control how often employees
                    can use optional holidays
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHolidaysEditor;