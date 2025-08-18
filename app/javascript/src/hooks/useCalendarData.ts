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
        leave_type_name: entry.leave_type || 'Leave',
        leave_date: entry.leave_date,
        duration: entry.duration,
        note: entry.note
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching timeoff entries:', error);
    return [];
  }
};

export const useCalendarData = (selectedDate: Date, options?: { includeTimeoff?: boolean; includeTimesheet?: boolean }) => {
  const { user } = useUserContext();
  const year = selectedDate.getFullYear();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);
  const userId = user?.id;
  
  // Default options
  const includeTimeoff = options?.includeTimeoff ?? false;
  const includeTimesheet = options?.includeTimesheet ?? false;

  // Fetch holidays for the year - always fetch
  const { data: holidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch timesheet entries for the month - only if requested
  const { data: timesheetEntries = [], isLoading: timesheetLoading } = useQuery({
    queryKey: ['timesheet', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM'), userId],
    queryFn: () => fetchTimesheetEntries(monthStart, monthEnd, userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: includeTimesheet && !!userId, // Only fetch when requested and we have a user ID
  });

  // Fetch timeoff entries for the year - only if requested
  const { data: timeoffEntries = [], isLoading: timeoffLoading } = useQuery({
    queryKey: ['timeoff', year],
    queryFn: () => fetchTimeoffEntries(year),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: includeTimeoff, // Only fetch when requested
  });

  // Convert to Schedule-X calendar events
  const calendarEvents: CalendarEvent[] = [];


  // Add holidays as events
  holidays.forEach(holiday => {
    if (!holiday.date) return;
    const holidayDate = new Date(holiday.date);
    if (isNaN(holidayDate.getTime())) return; // Skip invalid dates
    
    const event = {
      id: `holiday-${holiday.id}`,
      title: `🎉 ${holiday.name}`,
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

  // Add timesheet entries as events - only if requested
  if (includeTimesheet) {
    timesheetEntries.forEach(entry => {
      if (!entry.work_date) return;
      const entryDate = new Date(entry.work_date);
      if (isNaN(entryDate.getTime())) return; // Skip invalid dates
      
      const hours = Math.floor(entry.duration / 60);
      const minutes = entry.duration % 60;
      const durationText = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` : `${minutes}m`;
      
      calendarEvents.push({
        id: `timesheet-${entry.id}`,
        title: `💼 ${entry.project_name} • ${durationText}`,
        start: format(entryDate, "yyyy-MM-dd 09:00"),
        end: format(entryDate, "yyyy-MM-dd 18:00"),
        description: `${entry.client_name} - ${entry.note || 'Time tracked'}`,
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
  }

  // Add timeoff entries as events - only if requested
  if (includeTimeoff) {
    timeoffEntries.forEach(entry => {
      if (!entry.leave_date) return;
      const leaveDate = new Date(entry.leave_date);
      if (isNaN(leaveDate.getTime())) return; // Skip invalid dates
      
      const hours = Math.floor(entry.duration / 60);
      const minutes = entry.duration % 60;
      const durationText = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` : `${minutes}m`;
      const leaveIcon = entry.leave_type_name.toLowerCase().includes('sick') ? '🏥' : 
                        entry.leave_type_name.toLowerCase().includes('vacation') ? '🏖️' : 
                        entry.leave_type_name.toLowerCase().includes('annual') ? '📅' : '🏠';
      
      calendarEvents.push({
        id: `leave-${entry.id}`,
        title: `${leaveIcon} ${entry.leave_type_name} • ${durationText}`,
        start: format(leaveDate, "yyyy-MM-dd 09:00"),
        end: format(leaveDate, "yyyy-MM-dd 17:00"),
        description: entry.note || `${entry.leave_type_name} - ${durationText}`,
        calendarId: 'leave',
        _customContent: {
          type: 'leave',
          duration: entry.duration,
          leaveType: entry.leave_type_name
        }
      });
    });
  }



  return {
    events: calendarEvents,
    isLoading: holidaysLoading || timesheetLoading || timeoffLoading,
    holidays,
    timesheetEntries,
    timeoffEntries
  };
};