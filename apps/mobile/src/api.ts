import { apiBaseUrl } from "./config";
import type { MobileLoginResponse, TimeTrackingResponse, Workspace } from "./types";

type RequestOptions = {
  method?: "GET" | "POST";
  token?: string;
  email?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
  return request<MobileLoginResponse>("/api/v1/users/login?app=miru-mobile", {
    method: "POST",
    body: {
      user: {
        email,
        password,
      },
    },
  });
}

export async function fetchWorkspaces(email: string, token: string) {
  const data = await request<{ workspaces: Workspace[] }>("/api/v1/workspaces", {
    token,
    email,
  });

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
