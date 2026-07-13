import type { TeamMember } from "./team";

export interface TimeEntry {
  id: number;
  client_id?: number;
  client_name?: string;
  project_id?: number;
  project_name?: string;
  project?:
    | string
    | {
        id: number | string;
        name: string;
        billable: boolean;
      };
  duration: number;
  note: string;
  work_date?: string;
  bill_status?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  userId?: number;
  projectId?: number;
  workDate?: string;
  billStatus?: string;
  teamMember?: string;
  client?: string;
  clientLogo?: string;
}

export interface DayInfo {
  date: string;
  day: string;
  fullDate: string;
  month: string;
}

export interface Client {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  ein?: string;
  taxId?: string;
  currency?: string;
  clientCurrency?: string;
  previousInvoiceNumber?: string;
  minutes?: number;
}

export interface Project {
  id: number | string;
  name: string;
  client_id?: number | string;
  client_name?: string;
  client?: {
    id: number | string;
    name: string;
    logo?: string;
  };
  status?: "active" | "paused" | "completed";
  billable: boolean;
  totalHours?: number;
  allocatedHours?: number;
  teamMembers?: TeamMember[];
  startDate?: string;
  endDate?: string;
  description?: string;
  hourlyRate?: number;
  created_at?: string;
  updated_at?: string;
  clientName?: string;
  isBillable?: boolean;
  members?: TeamMember[];
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
