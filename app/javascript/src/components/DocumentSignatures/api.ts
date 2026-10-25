import Api from "apis/api";
import { quiet, failureMessage, download } from "../Agreements/api";
import type { SigningRequest } from "./types";

export { quiet, failureMessage, download };
export const endpoint = (id: number | string) => `/signature_requests/${id}`;
export const originalPath = (id: number, revision: number, key: string) =>
  `${endpoint(id)}/revisions/${revision}/originals/${key}`;

export const uploadDocuments = async (
  files: File[],
  attributes: object,
  id?: number
) => {
  const form = new FormData();
  form.append("signature_request", JSON.stringify(attributes));
  files.forEach(file => form.append("files[]", file));
  const { data } = await Api.post(
    id ? `${endpoint(id)}/sources` : "/signature_requests",
    form,
    { ...quiet, headers: { "Content-Type": undefined } }
  );

  return data.signature_request as SigningRequest;
};

export const originalBytes = async (
  path: string,
  signal?: InstanceType<typeof window.AbortController>["signal"]
) => {
  try {
    const { data } = await Api.get(path, {
      ...quiet,
      signal,
      responseType: "arraybuffer",
    });

    return data as ArrayBuffer;
  } catch (error: any) {
    const data = error?.response?.data;
    if (data instanceof ArrayBuffer && data.byteLength <= 65536) {
      try {
        error.response.data = JSON.parse(new window.TextDecoder().decode(data));
      } catch {
        /* Preserve the fallback for proxy errors. */
      }
    }
    throw error;
  }
};
