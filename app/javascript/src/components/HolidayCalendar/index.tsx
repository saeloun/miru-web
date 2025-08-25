import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import ScheduleCalendar from "../ui/schedule-calendar";
import { useCalendarData } from "../../hooks/useCalendarData";

const HolidayCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch only holidays for organization calendar - no timeoff or timesheet entries
  const { events, isLoading, holidays } = useCalendarData(selectedDate, {
    includeTimeoff: false,
    includeTimesheet: false,
  });

  const handleEventClick = (event: any) => {
    // Handle event click if needed
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const nationalHolidaysCount = holidays.filter(
    h => h.holiday_type === "national"
  ).length;

  const optionalHolidaysCount = holidays.filter(
    h => h.holiday_type === "optional"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-sm text-gray-600 mt-1">
            Organization-wide holidays and observances
          </p>
        </div>

        {/* Calendar Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {format(selectedDate, "yyyy")} Holidays
            </CardTitle>
            {holidays && holidays.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {nationalHolidaysCount} national{" "}
                {nationalHolidaysCount === 1 ? "holiday" : "holidays"} and{" "}
                {optionalHolidaysCount} optional{" "}
                {optionalHolidaysCount === 1 ? "holiday" : "holidays"}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <ScheduleCalendar
              events={events}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              defaultView="month-grid"
              calendars={[
                { id: "holidays", label: "Holidays", colorName: "holiday" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Holiday List */}
        {holidays && holidays.length > 0 && (
          <Card className="border-0 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Holiday List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* National Holidays */}
                {nationalHolidaysCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      National Holidays
                    </h3>
                    <div className="space-y-2">
                      {holidays
                        .filter(h => h.holiday_type === "national")
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime()
                        )
                        .map(holiday => (
                          <div
                            key={holiday.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-50"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {holiday.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {format(new Date(holiday.date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Optional Holidays */}
                {optionalHolidaysCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Optional Holidays
                    </h3>
                    <div className="space-y-2">
                      {holidays
                        .filter(h => h.holiday_type === "optional")
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime()
                        )
                        .map(holiday => (
                          <div
                            key={holiday.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-blue-50"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {holiday.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {format(new Date(holiday.date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar;
