// Time Tracking Types and Interfaces

export interface TimeEntry {
  id: number;
  client_id: number;
  client_name: string;
  project_id: number;
  project_name: string;
  project?: {
    id: number;
    name: string;
    billable: boolean;
  };
  duration: number;
  note: string;
  work_date: string;
  bill_status: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface DayInfo {
  date: string;
  day: string;
  fullDate: string;
  month: string;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  billable: boolean;
}

export interface EntryList {
  [date: string]: TimeEntry[];
}

export interface WeeklyData {
  clientName: string;
  projectId: number | null;
  projectName: string;
  entries: TimeEntry[];
}
