import axios from "axios";
import Api from "apis/api";

export const quiet = { skipErrorToast: true, skipSuccessToast: true };
const workspaceChanged =
  "The hiring workspace changed. Reload the current workspace.";

export const accessDenied = (error: unknown) =>
  (error instanceof Error && error.message === workspaceChanged) ||
  (axios.isAxiosError(error) &&
    ([403, 404].includes(error.response?.status ?? 0) ||
      error.response?.data?.workspace_changed === true));

export const failureMessage = (error: unknown) => {
  const errors = axios.isAxiosError(error)
    ? error.response?.data?.errors
    : null;

  return typeof errors === "string"
    ? errors
    : error instanceof Error && error.message === workspaceChanged
    ? workspaceChanged
    : "Unable to load or save this hiring record. Check your connection and retry.";
};

export const verifyWorkspace = (
  data: { company_id: number },
  companyId: number
) => {
  if (data.company_id !== companyId) throw new Error(workspaceChanged);
};

export const watchWorkspaceAccess = (
  companyId: number,
  deny: (message: string) => void
) => {
  const requests = new WeakSet<object>();
  const request = Api.interceptors.request.use(config => {
    if (/^\/(?:api\/v1\/)?hiring(?:\/|$)/.test(config.url || "")) {
      requests.add(config);
    }

    return config;
  });

  const response = Api.interceptors.response.use(
    result => {
      if (
        requests.has(result.config) &&
        result.data &&
        typeof result.data === "object" &&
        "company_id" in result.data
      ) {
        try {
          verifyWorkspace(result.data, companyId);
        } catch (error) {
          deny(failureMessage(error));
          throw error;
        }
      }

      return result;
    },
    error => {
      if (
        requests.has(error.config) &&
        (error.response?.status === 403 ||
          error.response?.data?.workspace_changed === true)
      ) {
        deny(failureMessage(error));
      }

      return Promise.reject(error);
    }
  );

  return () => {
    Api.interceptors.request.eject(request);
    Api.interceptors.response.eject(response);
  };
};

export const read = async <T extends { company_id: number }>(
  path: string,
  companyId: number,
  params: Record<string, string | number | boolean | undefined> = {},
  signal?: InstanceType<typeof window.AbortController>["signal"]
): Promise<T> => {
  const options = { ...quiet, signal };
  const filters = { ...params, company_id: companyId };
  const { data } =
    params.query !== undefined
      ? await Api.post<T>(
          `/hiring/${path}/search`,
          { hiring_search: filters },
          options
        )
      : await Api.get<T>(`/hiring/${path}`, { ...options, params: filters });
  verifyWorkspace(data, companyId);

  return data;
};
