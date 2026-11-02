import axios from "axios";
import Api from "apis/api";

export const quiet = { skipErrorToast: true, skipSuccessToast: true };
const workspaceChanged =
  "The hiring workspace changed. Reload the current workspace.";

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
