export const getCsrfToken = () =>
  document.querySelector('[name="csrf-token"]')?.getAttribute("content") || "";

export const getSessionRequestHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-CSRF-TOKEN": getCsrfToken(),
});
