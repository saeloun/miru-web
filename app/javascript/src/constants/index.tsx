import React from "react";

export enum ApiStatus {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

export const TOASTER_DURATION = 3000;

export const getToasterIcon = (type) => {
  switch (type) {
    case "success":
      return <img
        src="/success-check-circle.svg"
        className="items-center"
        alt="success"
      />;
    case "error":
      return <img
        src="/error-octagon.svg"
        className="items-center"
        alt="error"
      />;
    case "warning":
      return <img
        src="/warning-triangle.svg"
        className="items-center"
        alt="warning"
      />;
    case "info":
      return <img
        src="/info-circle.svg"
        className="items-center"
        alt="info"
      />;
    default:
      return <img
        src="/success-check-circle.svg"
        className="items-center"
        alt="success"
      />;
  }
};

export const getToasterCloseButton = ({ closeToast, type }) => {
  switch (type) {
    case "success":
      return <img
        src="/success-close-icon.svg"
        alt="close"
        onClick={closeToast}
      />;
    case "error":
      return <img
        src="/alert-error-close.svg"
        alt="close"
        onClick={closeToast}
      />;
    case "warning":
      return <img
        src="/warning-close-icon.svg"
        alt="close"
        onClick={closeToast}
      />;
    case "info":
      return <img
        src="/info-close-icon.svg"
        alt="close"
        onClick={closeToast}
      />;
    default:
      return <img
        src="/success-close-icon.svg"
        alt="close"
        onClick={closeToast}
      />;
  }
};
