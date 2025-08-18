import { useQuery } from '@tanstack/react-query';
import axios from '../apis/api';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useUserContext } from '../context/UserContext';

interface Holiday {
  id: number;
  name: string;
  date: string;
  holiday_type: 'national' | 'optional';
  year: number;
}

interface TimesheetEntry {
  id: number;
  user_id: number;
  project_id: number;
  project_name: string;
  client_name: string;
  duration: number;
  note: string;
  work_date: string;
  bill_status: string;
}

interface TimeoffEntry {
  id: number;
  user_id: number;
  leave_type_id: number;
  leave_type_name: string;
  leave_date: string;
  duration: number;
  note: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  calendarId: string;
  _customContent?: {
    type: string;
    duration?: number;
    project?: string;
    client?: string;
    status?: string;
  };
}

const fetchHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    // The holidays endpoint expects a year parameter, not as a path parameter
    const { data } = await axios.get(`/holidays`, { params: { year } });
    const holidays: Holiday[] = [];
    
    // Process holidays array from the API response
    if (data.holidays && data.holidays.length > 0) {
      const yearHoliday = data.holidays.find((h: any) => h.year === year) || data.holidays[0];
      
      // Process national holidays
      if (yearHoliday.national_holidays) {
        yearHoliday.national_holidays.forEach((holiday: any) => {
          holidays.push({
            id: holiday.id || Math.random(),
            name: holiday.name,
            date: holiday.date,
            holiday_type: 'national',
            year: year
          });
        });
      }
      
      // Process optional holidays
      if (yearHoliday.optional_holidays) {
        yearHoliday.optional_holidays.forEach((holiday: any) => {
          holidays.push({
            id: holiday.id || Math.random(),
            name: holiday.name,
            date: holiday.date,
            holiday_type: 'optional',
            year: year
          });
        });
      }
    }
    
    return holidays;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
};

const fetchTimesheetEntries = async (startDate: Date, endDate: Date, userId?: string | number): Promise<TimesheetEntry[]> => {
  try {
    const fromDate = format(startDate, 'yyyy-MM-dd');
    const toDate = format(endDate, 'yyyy-MM-dd');
    
    const params: any = {
      from: fromDate,
      to: toDate
    };
    
    if (userId) {
      params.user_id = userId;
    }
    
    const { data } = await axios.get(`/timesheet_entry`, { params });
    
    // The API returns entries as an object with dates as keys
    if (data.entries && typeof data.entries === 'object') {
      const allEntries: TimesheetEntry[] = [];
      
      // Iterate through each date's entries
      Object.keys(data.entries).forEach(date => {
        const dateEntries = data.entries[date];
        if (Array.isArray(dateEntries)) {
          dateEntries.forEach((entry: any) => {
            allEntries.push({
              id: entry.id,
              user_id: entry.userId || entry.user_id,
              project_id: entry.project_id,
              project_name: entry.project || entry.project_name,
              client_name: entry.client || entry.client_name,
              duration: entry.duration || entry.logged_minutes,
              note: entry.description || entry.task || entry.note,
              work_date: entry.date || date,
              bill_status: entry.billable ? 'billable' : 'non_billable'
            });
          });
        }
      });
      
      return allEntries;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching timesheet entries:', error);
    return [];
  }
};

const fetchTimeoffEntries = async (year: number): Promise<TimeoffEntry[]> => {
  try {
    const { data } = await axios.get(`/timeoff_entries`, {
      params: { year }
    });
    
    if (data.timeoff_entries) {
      return data.timeoff_entries.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        leave_type_id: entry.leave_type_id,
        leave_type_name: entry.leave_type?.name || 'Leave',
        leave_date: entry.leave_date,
        duration: entry.duration || entry.total_hours,
        note: entry.note
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching timeoff entries:', error);
    return [];
  }
};

export const useCalendarData = (selectedDate: Date) => {
  const { user } = useUserContext();
  const year = selectedDate.getFullYear();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const userId = user?.id;

  // Fetch holidays for the year
  const { data: holidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch timesheet entries for the month
  const { data: timesheetEntries = [], isLoading: timesheetLoading } = useQuery({
    queryKey: ['timesheet', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM'), userId],
    queryFn: () => fetchTimesheetEntries(monthStart, monthEnd, userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId, // Only fetch when we have a user ID
  });

  // Fetch timeoff entries for the year
  const { data: timeoffEntries = [], isLoading: timeoffLoading } = useQuery({
    queryKey: ['timeoff', year],
    queryFn: () => fetchTimeoffEntries(year),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Convert to Schedule-X calendar events
  const calendarEvents: CalendarEvent[] = [];

  // Debug logging
  console.log('Calendar Data Debug:', {
    holidaysCount: holidays.length,
    timesheetCount: timesheetEntries.length,
    timeoffCount: timeoffEntries.length,
    holidays: holidays
  });

  // Add holidays as events
  holidays.forEach(holiday => {
    if (!holiday.date) return;
    const holidayDate = new Date(holiday.date);
    if (isNaN(holidayDate.getTime())) return; // Skip invalid dates
    
    const event = {
      id: `holiday-${holiday.id}`,
      title: holiday.name,
      start: format(holidayDate, "yyyy-MM-dd 09:00"),
      end: format(holidayDate, "yyyy-MM-dd 17:00"),
      description: `${holiday.holiday_type === 'national' ? 'National' : 'Optional'} Holiday`,
      calendarId: 'holidays',
      _customContent: {
        type: 'holiday',
        status: holiday.holiday_type
      }
    };
    calendarEvents.push(event);
  });

  // Add timesheet entries as events
  timesheetEntries.forEach(entry => {
    if (!entry.work_date) return;
    const entryDate = new Date(entry.work_date);
    if (isNaN(entryDate.getTime())) return; // Skip invalid dates
    
    const hours = Math.floor(entry.duration / 60);
    const minutes = entry.duration % 60;
    
    calendarEvents.push({
      id: `timesheet-${entry.id}`,
      title: `${entry.project_name} (${hours}h ${minutes}m)`,
      start: format(entryDate, "yyyy-MM-dd 09:00"),
      end: format(entryDate, "yyyy-MM-dd 18:00"),
      description: entry.note || `Client: ${entry.client_name}`,
      calendarId: 'timesheet',
      _customContent: {
        type: 'timesheet',
        duration: entry.duration,
        project: entry.project_name,
        client: entry.client_name,
        status: entry.bill_status
      }
    });
  });

  // Add timeoff entries as events
  timeoffEntries.forEach(entry => {
    if (!entry.leave_date) return;
    const leaveDate = new Date(entry.leave_date);
    if (isNaN(leaveDate.getTime())) return; // Skip invalid dates
    
    calendarEvents.push({
      id: `leave-${entry.id}`,
      title: entry.leave_type_name,
      start: format(leaveDate, "yyyy-MM-dd HH:mm"),
      end: format(leaveDate, "yyyy-MM-dd HH:mm"),
      description: entry.note || 'Time off',
      calendarId: 'leave',
      _customContent: {
        type: 'leave',
        duration: entry.duration
      }
    });
  });

  // Final debug log
  console.log('Final Calendar Events:', {
    totalEvents: calendarEvents.length,
    events: calendarEvents,
    byType: {
      holidays: calendarEvents.filter(e => e.calendarId === 'holidays').length,
      timesheet: calendarEvents.filter(e => e.calendarId === 'timesheet').length,
      leave: calendarEvents.filter(e => e.calendarId === 'leave').length
    }
  });

  return {
    events: calendarEvents,
    isLoading: holidaysLoading || timesheetLoading || timeoffLoading,
    holidays,
    timesheetEntries,
    timeoffEntries
  };
};