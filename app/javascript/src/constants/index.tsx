/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-unused-vars */
import React from "react";

const alertErrorClose = require("../../../assets/images/alert-error-close.svg");
const errorOctagon = require("../../../assets/images/error-octagon.svg");
const infoCircle = require("../../../assets/images/info-circle.svg");
const infoCloseIcon = require("../../../assets/images/info-close-icon.svg");
const successCheckCircle = require("../../../assets/images/success-check-circle.svg");
const successCloseIcon = require("../../../assets/images/success-close-icon.svg");
const warningCloseIcon = require("../../../assets/images/warning-close-icon.svg");
const warningTriangle = require("../../../assets/images/warning-triangle.svg");

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
  SIGN_IN = "/user/sign_in",
  CLIENTS = "/clients",
  INVOICES = "/invoices",
  REPORTS = "/reports",
  PROJECTS = "/projects",
  SUBSCRIPTIONS = "/subscriptions",
  PAYMENTS = "/payments",
  TIME_TRACKING = "/time-tracking",
  TEAM = "/team/*",
  PROFILE = "/profile/*",
}

export const TOASTER_DURATION = 3000;

export const GetToasterIcon = ({ type }) => {
  switch (type) {
    case "success":
      return (
        <img alt="success" className="items-center" src={successCheckCircle} />
      );
    case "error":
      return <img alt="error" className="items-center" src={errorOctagon} />;
    case "warning":
      return (
        <img alt="warning" className="items-center" src={warningTriangle} />
      );
    case "info":
      return <img alt="info" className="items-center" src={infoCircle} />;
    default:
      return (
        <img alt="success" className="items-center" src={successCheckCircle} />
      );
  }
};

export const getToasterCloseButton = ({ closeToast, type }) => {
  switch (type) {
    case "success":
      return <img alt="success" src={successCloseIcon} onClick={closeToast} />;
    case "error":
      return <img alt="error" src={alertErrorClose} onClick={closeToast} />;
    case "warning":
      return <img alt="warning" src={warningCloseIcon} onClick={closeToast} />;
    case "info":
      return <img alt="info" src={infoCloseIcon} onClick={closeToast} />;
    default:
      return <img alt="success" src={successCloseIcon} onClick={closeToast} />;
  }
};

export const BASIC_PLAN_CHARGE = 10;

export const TEAM_MEMBER_CHARGE = 5;

export enum TeamModalType {
  NONE = "",
  ADD_EDIT = "addEdit",
  DELETE = "delete",
}
