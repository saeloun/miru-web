export interface MobileUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  currentWorkspaceId: number | null;
  token: string;
  avatarUrl?: string | null;
  confirmed?: boolean;
}

export interface Workspace {
  id: number;
  name: string;
  logo?: string | null;
}

export interface Company {
  id: number;
  name: string;
  dateFormat?: string;
  planTier?: string;
}

export interface MobileLoginResponse {
  notice: string;
  user: MobileUser;
  companyRole: string | null;
  company: Company | null;
}

export interface TimeTrackingEntry {
  id: number;
  duration: number;
  note: string | null;
  type: "timesheet" | "leave";
  workDate?: string;
  leaveDate?: string;
  client?: string;
  project?: string;
  projectId?: number;
  billStatus?: string;
}

export interface TimeTrackingResponse {
  entries?: Record<string, TimeTrackingEntry[]>;
}
