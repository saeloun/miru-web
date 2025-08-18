import React from 'react';
import { 
  viewDay, 
  viewWeek, 
  viewMonthGrid, 
  viewMonthAgenda
} from '@schedule-x/calendar';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import { cn } from '../../lib/utils';
import { Card } from './card';
import './schedule-calendar.css';

interface CalendarEvent {
  id: string | number;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  people?: string[];
  calendarId?: string;
  rrule?: string;
  _customContent?: any;
}

interface ScheduleCalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: any) => void;
  onDateSelect?: (date: Date) => void;
  onEventUpdate?: (event: any) => void;
  className?: string;
  defaultView?: 'day' | 'week' | 'month-grid' | 'month-agenda';
  calendars?: Array<{
    id: string;
    label: string;
    colorName: string;
  }>;
  selectedDate?: Date;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  events = [],
  onEventClick,
  onDateSelect,
  onEventUpdate,
  className,
  defaultView = 'month-grid',
  calendars = [],
  selectedDate = new Date()
}) => {
  // Define calendars with shadcn-compatible colors
  const defaultCalendars = calendars.length > 0 ? calendars : [
    {
      id: 'holidays',
      label: 'Holidays',
      colorName: 'holiday'
    },
    {
      id: 'timesheet',
      label: 'Timesheet',
      colorName: 'timesheet'
    },
    {
      id: 'leave',
      label: 'Leave',
      colorName: 'leave'
    }
  ];

  const calendarsConfig = defaultCalendars.reduce((acc, cal) => {
    acc[cal.id] = {
      colorName: cal.colorName,
      lightColors: {
        main: `var(--sx-color-${cal.colorName})`,
        container: `var(--sx-color-${cal.colorName}-container)`,
        onContainer: `var(--sx-color-on-${cal.colorName}-container)`
      },
      darkColors: {
        main: `var(--sx-color-${cal.colorName})`,
        container: `var(--sx-color-${cal.colorName}-container)`,
        onContainer: `var(--sx-color-on-${cal.colorName}-container)`
      }
    };
    return acc;
  }, {} as Record<string, any>);

  const calendar = useCalendarApp({
    locale: 'en-US',
    defaultView,
    views: [viewDay, viewWeek, viewMonthGrid, viewMonthAgenda],
    events: events.map(event => ({
      ...event,
      id: String(event.id),
      calendarId: event.calendarId || 'holidays'
    })),
    calendars: calendarsConfig,
    dayBoundaries: {
      start: '00:00',
      end: '24:00'
    },
    callbacks: {
      onEventClick: (calendarEvent: any) => {
        if (onEventClick) {
          onEventClick(calendarEvent);
        }
      },
      onSelectedDateUpdate: (date: string) => {
        if (onDateSelect) {
          onDateSelect(new Date(date));
        }
      },
      onEventUpdate: (event: any) => {
        if (onEventUpdate) {
          onEventUpdate(event);
        }
      }
    }
  }, [events]);

  return (
    <div className={cn("sx-shadcn-theme", className)}>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
};

export default ScheduleCalendar;