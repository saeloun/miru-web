/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-unused-vars */

export enum ApiStatus {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

export enum Roles {
  ADMIN = "admin",
  OWNER = "owner",
  BOOK_KEEPER = "book_keeper",
  EMPLOYEE = "employee",
  CLIENT = "client",
}

export enum Paths {
  FORGOT_PASSWORD = "/password/new",
  RESET_PASSWORD = "/password/edit",
  SIGNUP = "/signup",
  SIGNUP_SUCCESS = "/signup/success",
  LOGIN = "/login",
  SIGN_IN = "/user/sign_in",
  CLIENTS = "/clients",
  INVOICES = "/invoices/*",
  REPORTS = "/reports",
  PROJECTS = "/projects",
  SUBSCRIPTIONS = "/subscriptions",
  PAYMENTS = "/payments",
  TIME_TRACKING = "/time-tracking",
  TEAM = "/team/*",
  TEAMS = "/teams/*",
  SETTINGS = "/settings/*",
  AUTHORIZATION = "/authorization",
  Leave_Management = "/leave-management",
}

export enum BILL_STATUS {
  BILLED = "billed",
  UNBILLED = "unbilled",
  NON_BILLABLE = "non_billable",
}

export enum HOLIDAY_TYPES {
  NATIONAL = "national",
  OPTIONAL = "optional",
}

export const BASIC_PLAN_CHARGE = 10;

export const TEAM_MEMBER_CHARGE = 5;

export enum TeamModalType {
  NONE = "",
  ADD_EDIT = "addEdit",
  DELETE = "delete",
}

export enum LocalStorageKeys {
  INVOICE_FILTERS = "invoiceFilters",
  INVOICE_SEARCH_PARAM = "",
  REVENUE_FILTERS = "REVENUEFiters",
}

export const MIRU_APP_URL = "https://miru.so/";
export const MIRU_APP_SUPPORT_EMAIL_ID = "mailto:hello@saeloun.com";
export const GOOGLE_PRIVACY_URL =
  "https://policies.google.com/privacy?hl=en-US";
export const AWS_PRIVACY_URL = "https://aws.amazon.com/privacy/";
export const STRIPE_PRIVACY_URL = "https://stripe.com/in/privacy";
