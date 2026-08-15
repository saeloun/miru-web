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
  baseCurrency?: string;
  dateFormat?: string;
  planTier?: string;
}

export interface MobileLoginResponse {
  notice: string;
  user: MobileUser;
  companyRole: string | null;
  company: Company | null;
}

export interface MobileBootstrapResponse
  extends Omit<MobileLoginResponse, "notice"> {
  capabilities: Record<string, boolean>;
  workspace: {
    id: number;
    name: string;
    baseCurrency: string;
    dateFormat: string;
  } | null;
}

export interface CurrentTimer {
  billable: boolean;
  elapsed_ms: number;
  notes: string;
  project_name: string;
  running: boolean;
  source?: string | null;
  started_at: string | null;
  synced_at: string | null;
  task_name: string;
  timer_deck: Record<string, unknown> | null;
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
  teamMember?: string;
  source?: string | null;
  sourceLabel?: string | null;
  sourceMetadata?: Record<string, string> | null;
}

export interface TimeTrackingResponse {
  entries?: Record<string, TimeTrackingEntry[]>;
}
