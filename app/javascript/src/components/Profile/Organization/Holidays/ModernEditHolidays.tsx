import React from "react";
import { format } from "date-fns";
import {
  Calendar,
  Trash,
  Plus,
  X,
  Check,
} from "@phosphor-icons/react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Switch } from "../../../ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../ui/popover";
import { Calendar as CalendarComponent } from "../../../ui/calendar";
import { cn } from "../../../../lib/utils";

interface ModernEditHolidaysProps {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  enableOptionalHolidays: boolean;
  setEnableOptionalHolidays: (enabled: boolean) => void;
  holidayList: any[];
  optionalHolidaysList: any[];
  totalOptionalHolidays: number;
  isDisableUpdateBtn: boolean;
  handleAddHoliday: (isOptional: boolean) => void;
  handleCancelAction: () => void;
  handleDeleteHoliday: (index: number, isOptional: boolean) => void;
  handleHolidateNameChange: (index: number, value: string, isOptional: boolean) => void;
  handleDatePicker: (index: number, date: Date | undefined, isOptional: boolean) => void;
  handleChangeTotalOpHoliday: (value: string) => void;
  handleChangeRepetitionOpHoliday: (value: string) => void;
  updateHolidayDetails: () => void;
  optionalRepetitionType: string;
  dateFormat: string;
}

const ModernEditHolidays: React.FC<ModernEditHolidaysProps> = ({
  currentYear,
  setCurrentYear,
  enableOptionalHolidays,
  setEnableOptionalHolidays,
  holidayList,
  optionalHolidaysList,
  totalOptionalHolidays,
  isDisableUpdateBtn,
  handleAddHoliday,
  handleCancelAction,
  handleDeleteHoliday,
  handleHolidateNameChange,
  handleDatePicker,
  handleChangeTotalOpHoliday,
  handleChangeRepetitionOpHoliday,
  updateHolidayDetails,
  optionalRepetitionType,
  dateFormat,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Edit Holidays
              </h1>
              <p className="text-slate-600 mt-2 text-base">
                Manage holidays for {currentYear}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Select
                value={currentYear.toString()}
                onValueChange={(value) => setCurrentYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleCancelAction}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={updateHolidayDetails}
                disabled={isDisableUpdateBtn}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Public Holidays */}
        <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50/80 to-blue-50/40 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Public Holidays
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Define company-wide holidays
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => handleAddHoliday(false)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {holidayList.length > 0 ? (
                holidayList.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`date-${index}`} className="text-sm font-medium text-slate-700">
                          Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id={`date-${index}`}
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !holiday.date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {holiday.date || "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={holiday.date ? new Date(holiday.date) : undefined}
                              onSelect={(date) => handleDatePicker(index, date, false)}
                              initialFocus
                              fromYear={currentYear}
                              toYear={currentYear}
                              defaultMonth={new Date(currentYear, 0)}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`} className="text-sm font-medium text-slate-700">
                          Holiday Name
                        </Label>
                        <Input
                          id={`name-${index}`}
                          value={holiday.name || ""}
                          onChange={(e) => handleHolidateNameChange(index, e.target.value, false)}
                          placeholder="Enter holiday name"
                          className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHoliday(index, false)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No public holidays added. Click "Add Holiday" to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optional Holidays */}
        <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white/70 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50/80 to-purple-50/40 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Optional Holidays
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Holidays employees can choose from
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={enableOptionalHolidays}
                  onCheckedChange={setEnableOptionalHolidays}
                />
                <Label className="text-sm font-medium text-slate-700">
                  Enable
                </Label>
              </div>
            </div>
          </CardHeader>
          {enableOptionalHolidays && (
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50/30 rounded-lg border border-purple-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Total Optional Holidays
                    </Label>
                    <Input
                      type="number"
                      value={totalOptionalHolidays}
                      onChange={(e) => handleChangeTotalOpHoliday(e.target.value)}
                      className="border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Allocation Frequency
                    </Label>
                    <Select
                      value={optionalRepetitionType}
                      onValueChange={handleChangeRepetitionOpHoliday}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-slate-800">Holiday List</h3>
                  <Button
                    onClick={() => handleAddHoliday(true)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Optional Holiday
                  </Button>
                </div>

                <div className="space-y-4">
                  {optionalHolidaysList.length > 0 ? (
                    optionalHolidaysList.map((holiday, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-purple-50/30 rounded-xl border border-purple-100 hover:bg-purple-50/50 transition-colors"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`opt-date-${index}`} className="text-sm font-medium text-slate-700">
                              Date
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id={`opt-date-${index}`}
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !holiday.date && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {holiday.date || "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={holiday.date ? new Date(holiday.date) : undefined}
                                  onSelect={(date) => handleDatePicker(index, date, true)}
                                  initialFocus
                                  fromYear={currentYear}
                                  toYear={currentYear}
                                  defaultMonth={new Date(currentYear, 0)}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`opt-name-${index}`} className="text-sm font-medium text-slate-700">
                              Holiday Name
                            </Label>
                            <Input
                              id={`opt-name-${index}`}
                              value={holiday.name || ""}
                              onChange={(e) => handleHolidateNameChange(index, e.target.value, true)}
                              placeholder="Enter holiday name"
                              className="border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteHoliday(index, true)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-5 w-5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No optional holidays added. Click "Add Optional Holiday" to get started.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ModernEditHolidays;