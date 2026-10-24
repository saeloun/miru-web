import Api from "apis/api";

export const quiet = { skipErrorToast: true, skipSuccessToast: true };
export const endpoint = (type: string) =>
  type === "templates" ? "/agreement_templates" : "/agreements";
export const recordKey = (type: string) =>
  type === "templates" ? "agreement_template" : "agreement";
export const failureMessage = (error: any) => {
  const errors = error?.response?.data?.errors;

  return typeof errors === "string"
    ? errors
    : Array.isArray(errors)
    ? errors.join(". ")
    : "Unable to save or load this document. Check your connection and retry.";
};

export const download = (content: Blob, filename: string) => {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadPdf = async (id: number) => {
  const { data } = await Api.get(`/agreements/${id}/download`, {
    ...quiet,
    responseType: "blob",
  });
  download(data, `agreement-${id}-draft.pdf`);
};
