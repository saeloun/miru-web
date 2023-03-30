import React from "react";

import { toast, Slide } from "react-toastify";

import { GetToasterIcon, getToasterCloseButton } from "../constants";

const customId = "custom-toaster-id";

const ToastrComponent = ({ message }) => (
  <div className="text-center">{message}</div>
);

const showToastr = message => {
  toast.success(<ToastrComponent message={message} />, {
    toastId: customId,
    position: toast.POSITION.TOP_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="success" />,
    closeButton: ({ closeToast }) =>
      getToasterCloseButton({ closeToast, type: "success" }),
    hideProgressBar: true,
  });
};

const isError = e => e && e.stack && e.message;
const isString = e => typeof e === "string" || e instanceof String;
const isArray = e => Array.isArray(e);

const showErrorToastr = error => {
  const toastMsg = err =>
    toast.error(<ToastrComponent message={err} />, {
      toastId: customId,
      position: toast.POSITION.TOP_CENTER,
      transition: Slide,
      theme: "colored",
      icon: <GetToasterIcon type="error" />,
      closeButton: ({ closeToast }) =>
        getToasterCloseButton({ closeToast, type: "error" }),
      hideProgressBar: true,
    });

  if (isError(error)) {
    toastMsg(error);
  } else if (isString(error)) {
    toastMsg(error);
  } else if (isArray(error)) {
    error.forEach(err => {
      toastMsg(err);
    });
  } else {
    Object.keys(error).forEach(key => {
      isArray(error[key])
        ? error[key].forEach(newErr => {
            toastMsg(newErr);
          })
        : toastMsg(error[key]);
    });
  }
};

const showWarningToastr = warning => {
  toast.warn(<ToastrComponent message={warning} />, {
    toastId: customId,
    position: toast.POSITION.TOP_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="warning" />,
    closeButton: ({ closeToast }) =>
      getToasterCloseButton({ closeToast, type: "warning" }),
    hideProgressBar: true,
  });
};

const showInfoToastr = info => {
  toast.info(<ToastrComponent message={info} />, {
    toastId: customId,
    position: toast.POSITION.TOP_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="info" />,
    closeButton: ({ closeToast }) =>
      getToasterCloseButton({ closeToast, type: "info" }),
    hideProgressBar: true,
  });
};

export const Toastr = {
  success: showToastr,
  error: showErrorToastr,
  warning: showWarningToastr,
  info: showInfoToastr,
};

export default Toastr;
