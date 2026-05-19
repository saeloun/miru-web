import { getValueFromLocalStorage } from "utils/storage";

type StoredAuthCredentials = {
  email: string;
  token: string;
};

const AUTH_HEADER_BYPASS_PATHS = [
  "/users/login",
  "/users/signup",
  "/users/forgot_password",
  "/users/reset_password",
  "/users/resend_confirmation_email",
  "/users/passkeys/authenticate",
  "/users/totp/authenticate",
  "/users/otp/request",
  "/users/otp/verify",
];

const storedString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getCsrfToken = () =>
  document.querySelector('[name="csrf-token"]')?.getAttribute("content") || "";

export const getStoredAuthCredentials = (): StoredAuthCredentials | null => {
  const token = storedString(getValueFromLocalStorage("authToken"));
  const email = storedString(getValueFromLocalStorage("authEmail"));

  if (!token || !email || token === "session") return null;

  return { email, token };
};

export const hasStoredAuthCredentials = () =>
  Boolean(getStoredAuthCredentials());

export const getStoredAuthHeaders = () => {
  const credentials = getStoredAuthCredentials();
  if (!credentials) return {};

  return {
    "X-Auth-Email": credentials.email,
    "X-Auth-Token": credentials.token,
  };
};

export const getSessionRequestHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-CSRF-TOKEN": getCsrfToken(),
  ...getStoredAuthHeaders(),
});

export const shouldAttachStoredAuthHeaders = (url?: string) => {
  if (!url) return true;

  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (parsedUrl.origin !== window.location.origin) return false;
  } catch (_error) {
    return false;
  }

  return !AUTH_HEADER_BYPASS_PATHS.some(path => url.includes(path));
};
