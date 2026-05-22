export const getCsrfToken = () =>
  document.querySelector('[name="csrf-token"]')?.getAttribute("content") || "";

export const getStoredAuthCredentials = () => null;

export const hasStoredAuthCredentials = () => false;

export const getStoredAuthHeaders = () => ({});

export const getSessionRequestHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-CSRF-TOKEN": getCsrfToken(),
});

export const shouldAttachStoredAuthHeaders = () => false;
