import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import ScheduleCalendar from "../../../ui/schedule-calendar";
import { useCalendarData } from "../../../../hooks/useCalendarData";
import { Button } from "../../../ui/button";
import { Calendar, PencilSimple } from "phosphor-react";

interface ModernHolidaysProps {
  currentYear: number;
  dateFormat: string;
  holidays: any[];
  publicHolidays: any[];
  optionalHolidays: any[];
  editAction: () => void;
  toggleCalendarModal: () => void;
}

const ModernHolidays: React.FC<ModernHolidaysProps> = ({
  currentYear,
  dateFormat,
  holidays,
  publicHolidays,
  optionalHolidays,
  editAction,
  toggleCalendarModal,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch only holidays for organization calendar - no timeoff or timesheet entries
  const { events, isLoading } = useCalendarData(selectedDate, {
    includeTimeoff: false,
    includeTimesheet: false,
  });

  const handleEventClick = (event: any) => {
    // Handle event click if needed
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const nationalHolidaysCount = publicHolidays?.length || 0;
  const optionalHolidaysCount = optionalHolidays?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Holiday Calendar
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage organization-wide holidays and observances for{" "}
                {currentYear}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={editAction}>
                <PencilSimple className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="default" onClick={toggleCalendarModal}>
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {currentYear} Holiday Calendar
            </CardTitle>
            {(nationalHolidaysCount > 0 || optionalHolidaysCount > 0) && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {nationalHolidaysCount} national{" "}
                {nationalHolidaysCount === 1 ? "holiday" : "holidays"} and{" "}
                {optionalHolidaysCount} optional{" "}
                {optionalHolidaysCount === 1 ? "holiday" : "holidays"}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Holiday Lists */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* National Holidays */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">National Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              {nationalHolidaysCount > 0 ? (
                <div className="space-y-2">
                  {publicHolidays
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((holiday, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {holiday.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {holiday.date
                            ? format(new Date(holiday.date), "MMM dd, yyyy")
                            : "-"}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No national holidays configured
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Holidays */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Optional Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              {optionalHolidaysCount > 0 ? (
                <div className="space-y-2">
                  {optionalHolidays
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((holiday, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {holiday.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {holiday.date
                            ? format(new Date(holiday.date), "MMM dd, yyyy")
                            : "-"}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No optional holidays configured
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernHolidays;
