import { apiBaseUrl } from "./config";
import type {
  Company,
  CurrentTimer,
  MobileBootstrapResponse,
  MobileLoginResponse,
  MobileUser,
  TimeTrackingResponse,
  Workspace,
} from "./types";

type RequestOptions = {
  method?: "GET" | "PATCH" | "POST";
  token?: string;
  email?: string;
  body?: unknown;
};

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.email ? { "X-Auth-Email": options.email } : {}),
      ...(options.token ? { "X-Auth-Token": options.token } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.notice === "string" && data.notice) ||
      "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function login(email: string, password: string) {
  const data = await request<ApiSessionResponse>(
    "/api/v1/users/login?app=miru-mobile",
    {
      method: "POST",
      body: {
        user: {
          email,
          password,
        },
      },
    }
  );

  return normalizeSession(data);
}

export async function fetchBootstrap(email: string, token: string) {
  const data = await request<ApiBootstrapResponse>("/api/v1/mobile/bootstrap", {
    token,
    email,
  });

  return {
    ...normalizeSession(data),
    capabilities: data.capabilities,
    workspace: data.workspace
      ? {
          id: data.workspace.id,
          name: data.workspace.name,
          baseCurrency: data.workspace.base_currency,
          dateFormat: data.workspace.date_format,
        }
      : null,
  } satisfies MobileBootstrapResponse;
}

export async function fetchWorkspaces(email: string, token: string) {
  const data = await request<{ workspaces: Workspace[] }>(
    "/api/v1/workspaces",
    {
      token,
      email,
    }
  );

  return data.workspaces;
}

export async function fetchTimeTracking(email: string, token: string) {
  const data = await request<TimeTrackingResponse>("/api/v1/time-tracking", {
    token,
    email,
  });

  return {
    ...data,
    entries: data.entries || {},
  };
}

export async function fetchCurrentTimer(email: string, token: string) {
  const data = await request<{ current_timer: CurrentTimer }>(
    "/api/v1/mobile/current_timer",
    {
      token,
      email,
    }
  );

  return data.current_timer;
}

export async function updateCurrentTimer(
  email: string,
  token: string,
  currentTimer: CurrentTimer
) {
  const data = await request<{ current_timer: CurrentTimer }>(
    "/api/v1/mobile/current_timer",
    {
      method: "PATCH",
      token,
      email,
      body: { current_timer: currentTimer },
    }
  );

  return data.current_timer;
}

export async function selectWorkspace(
  email: string,
  token: string,
  workspaceId: number
) {
  await request(`/api/v1/workspaces/${workspaceId}`, {
    method: "PATCH",
    token,
    email,
  });
}

type ApiUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  current_workspace_id: number | null;
  token: string;
  avatar_url?: string | null;
  confirmed?: boolean;
};

type ApiCompany = {
  id: number;
  name: string;
  base_currency?: string;
  date_format?: string;
  plan_tier?: string;
};

type ApiSessionResponse = {
  notice?: string;
  user: ApiUser;
  company_role: string | null;
  company: ApiCompany | null;
};

type ApiBootstrapResponse = ApiSessionResponse & {
  capabilities: Record<string, boolean>;
  workspace: {
    id: number;
    name: string;
    base_currency: string;
    date_format: string;
  } | null;
};

function normalizeSession(data: ApiSessionResponse): MobileLoginResponse {
  return {
    notice: data.notice || "",
    user: normalizeUser(data.user),
    companyRole: data.company_role,
    company: normalizeCompany(data.company),
  };
}

function normalizeUser(user: ApiUser): MobileUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    currentWorkspaceId: user.current_workspace_id,
    token: user.token,
    avatarUrl: user.avatar_url,
    confirmed: user.confirmed,
  };
}

function normalizeCompany(company: ApiCompany | null): Company | null {
  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    baseCurrency: company.base_currency,
    dateFormat: company.date_format,
    planTier: company.plan_tier,
  };
}
