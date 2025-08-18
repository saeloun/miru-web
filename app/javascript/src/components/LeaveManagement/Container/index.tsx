import React, { Fragment, useState } from "react";

import { useUserContext } from "context/UserContext";
import { getYear, format } from "date-fns";
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
  optionalHolidayList,
  nationalHolidayList,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { company } = useUserContext();
  
  // Use the calendar data hook
  const { events, isLoading } = useCalendarData(selectedDate);

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
    // You can open a modal or show details here
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
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
        </div>
        <div className="p-6">
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
        </div>
      </div>
      
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