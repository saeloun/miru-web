/* eslint-disable @typescript-eslint/no-var-requires */
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

export const TOASTER_DURATION = 3000;

export const GetToasterIcon = ({ type }) => {
  switch (type) {
    case "success":
      return <img
        src={successCheckCircle}
        className="items-center"
        alt="success"
      />;
    case "error":
      return <img
        src={errorOctagon}
        className="items-center"
        alt="error"
      />;
    case "warning":
      return <img
        src={warningTriangle}
        className="items-center"
        alt="warning"
      />;
    case "info":
      return <img
        src={infoCircle}
        className="items-center"
        alt="info"
      />;
    default:
      return <img
        src={successCheckCircle}
        className="items-center"
        alt="success"
      />;
  }
};

export const getToasterCloseButton = ({ closeToast, type }) => {
  switch (type) {
    case "success":
      return <img
        src={successCloseIcon}
        alt="success"
        onClick={closeToast}
      />;
    case "error":
      return <img
        src={alertErrorClose}
        alt="error"
        onClick={closeToast}
      />;
    case "warning":
      return <img
        src={warningCloseIcon}
        alt="warning"
        onClick={closeToast}
      />;
    case "info":
      return <img
        src={infoCloseIcon}
        alt="info"
        onClick={closeToast}
      />;
    default:
      return <img
        src={successCloseIcon}
        alt="success"
        onClick={closeToast}
      />;
  }
};

export const BASIC_PLAN_CHARGE = 10;

export const TEAM_MEMBER_CHARGE = 5;
