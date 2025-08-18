import React, { useState } from "react";

import { useUserContext } from "context/UserContext";
import { minToHHMM } from "helpers";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import ScheduleCalendar from "../../ui/schedule-calendar";
import { useCalendarData } from "../../../hooks/useCalendarData";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const Container = ({
  getLeaveBalanaceDateText,
  leaveBalance,
  timeoffEntries,
  totalTimeoffEntriesDuration,
  selectedLeaveType,
  setSelectedLeaveType,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { company } = useUserContext();

  // Use the calendar data hook - for personal leaves page, fetch holidays AND user's timeoff
  const { events, isLoading, holidays } = useCalendarData(selectedDate, { 
    includeTimeoff: true,   // Show personal timeoff on user's leaves page
    includeTimesheet: false // Don't show timesheet entries on leaves page
  });

  const handleEventClick = (event: any) => {
    // Handle event click if needed
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      {leaveBalance && leaveBalance.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {getLeaveBalanaceDateText()}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {leaveBalance.map((leaveType, index) => (
              <LeaveBlock
                key={index}
                leaveType={leaveType}
                selectedLeaveType={selectedLeaveType}
                setSelectedLeaveType={setSelectedLeaveType}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calendar Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Calendar</CardTitle>
          {holidays && holidays.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {holidays.filter(h => h.holiday_type === 'national').length} national and {holidays.filter(h => h.holiday_type === 'optional').length} optional holidays
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
              { id: 'holidays', label: 'Holidays', colorName: 'holiday' },
              { id: 'timesheet', label: 'Time Tracked', colorName: 'timesheet' },
              { id: 'leave', label: 'Time Off', colorName: 'leave' }
            ]}
          />
        </CardContent>
      </Card>

      {/* Leave Details Table */}
      {timeoffEntries && timeoffEntries.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-semibold">Leave History</CardTitle>
                {selectedLeaveType && (
                  <div className="flex items-center gap-2 rounded-md bg-miru-han-purple-100 px-3 py-1.5 text-sm">
                    <span className="font-medium text-miru-han-purple-1000">
                      {selectedLeaveType.name}
                    </span>
                    <X
                      className="h-3.5 w-3.5 cursor-pointer text-miru-han-purple-600 hover:text-miru-han-purple-1000"
                      onClick={() => setSelectedLeaveType(null)}
                    />
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">
                  {minToHHMM(totalTimeoffEntriesDuration || 0)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table timeoffEntries={timeoffEntries} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Container;
