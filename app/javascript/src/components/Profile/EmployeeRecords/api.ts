import http from "apis/api";

type Signal = InstanceType<typeof window.AbortController>["signal"];

export const requestOptions = (signal: Signal) => ({
  signal,
  skipErrorToast: true,
  skipSuccessToast: true,
  headers: { "Cache-Control": "no-store" },
});

export const employeeRecordsApi = {
  record: (userId: string, signal: Signal) =>
    http.get("/employee_records", {
      ...requestOptions(signal),
      params: { user_id: userId },
    }),
  save: (identity, privateDetails, signal: Signal) =>
    http.patch(
      "/employee_records",
      {
        employee_record: { ...identity, private_details: privateDetails },
      },
      requestOptions(signal)
    ),
  payments: (userId: string, page: number, signal: Signal) =>
    http.get("/employee_records/payments", {
      ...requestOptions(signal),
      params: { user_id: userId, page },
    }),
  pay: (identity, payment, signal: Signal) =>
    http.post(
      "/employee_records/payments",
      {
        employee_payment: { ...identity, ...payment },
      },
      requestOptions(signal)
    ),
  upload: (identity, kind: string, file: File, signal: Signal) => {
    const data = new FormData();
    Object.entries({ ...identity, kind, file }).forEach(([key, value]) =>
      data.append(`employee_document[${key}]`, value as string | Blob)
    );

    return http.post("/employee_records/documents", data, {
      ...requestOptions(signal),
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const downloadAttachment = async (
  path: string,
  filename: string,
  signal: Signal,
  params = {}
) => {
  const response = await http.get(path, {
    ...requestOptions(signal),
    responseType: "blob",
    params,
  });
  if (signal.aborted) return;

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const errorMessage = async error => {
  let data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }

  return typeof data?.errors === "string" ? data.errors : null;
};
