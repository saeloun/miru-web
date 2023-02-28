/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-unused-vars */
import React from "react";

import {
  AlertSVG,
  ErrorOctagonSVG,
  CircleInfoSVG,
  CloseInfoSVG,
  ClickSuccessSVG,
  SuccessSVG,
  WarningTriangleSVG,
  WarningCloseIconSVG,
} from "miruIcons";

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
}

export enum Paths {
  FORGOT_PASSWORD = "/password/new",
  RESET_PASSWORD = "/password/edit",
  SIGNUP = "/signup",
  LOGIN = "/login",
  SIGN_IN = "/user/sign_in",
  CLIENTS = "/clients",
  INVOICES = "/invoices",
  REPORTS = "/reports",
  PROJECTS = "/projects",
  SUBSCRIPTIONS = "/subscriptions",
  PAYMENTS = "/payments",
  TIME_TRACKING = "/time-tracking",
  TEAM = "/team/*",
  TEAMS = "/teams/*",
  PROFILE = "/profile/*",
  AUTHORIZATION = "/authorization",
}

export const TOASTER_DURATION = 3000;

export const GetToasterIcon = ({ type }) => {
  switch (type) {
    case "success":
      return (
        <img alt="success" className="items-center" src={ClickSuccessSVG} />
      );
    case "error":
      return <img alt="error" className="items-center" src={ErrorOctagonSVG} />;
    case "warning":
      return (
        <img alt="warning" className="items-center" src={WarningTriangleSVG} />
      );
    case "info":
      return <img alt="info" className="items-center" src={CircleInfoSVG} />;
    default:
      return (
        <img alt="success" className="items-center" src={ClickSuccessSVG} />
      );
  }
};

export const getToasterCloseButton = ({ closeToast, type }) => {
  switch (type) {
    case "success":
      return <img alt="success" src={SuccessSVG} onClick={closeToast} />;
    case "error":
      return <img alt="error" src={AlertSVG} onClick={closeToast} />;
    case "warning":
      return (
        <img alt="warning" src={WarningCloseIconSVG} onClick={closeToast} />
      );
    case "info":
      return <img alt="info" src={CloseInfoSVG} onClick={closeToast} />;
    default:
      return <img alt="success" src={SuccessSVG} onClick={closeToast} />;
  }
};

export const BASIC_PLAN_CHARGE = 10;

export const TEAM_MEMBER_CHARGE = 5;

export enum TeamModalType {
  NONE = "",
  ADD_EDIT = "addEdit",
  DELETE = "delete",
}

export enum LocalStorageKeys {
  INVOICE_FILTERS = "invoiceFilters",
}

export const MIRU_APP_URL = "https://miru.so/";
export const MIRU_APP_SUPPORT_EMAIL_ID = "mailto:mirusupport@saeloun.com";
