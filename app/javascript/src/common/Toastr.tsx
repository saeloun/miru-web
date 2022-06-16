import React from "react";

import { toast, Slide } from "react-toastify";
import { GetToasterIcon, getToasterCloseButton } from "../constants/index";

const ToastrComponent = ({ message }) => (
  <div className="text-center">
    {message}
  </div>
);

const showToastr = message => {
  toast.success(<ToastrComponent message={message} />, {
    position: toast.POSITION.BOTTOM_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="success" />,
    closeButton: (closeToast) => getToasterCloseButton({ closeToast, type: "success" }),
    hideProgressBar: true
  });
};

const isError = e => e && e.stack && e.message;

const showErrorToastr = error => {
  const errorMessage = isError(error) ? error.message : error;
  toast.error(<ToastrComponent message={errorMessage} />, {
    position: toast.POSITION.BOTTOM_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="error" />,
    closeButton: (closeToast) => getToasterCloseButton({ closeToast, type: "error" }),
    hideProgressBar: true
  });
};

const showWarningToastr = warning => {
  toast.warn(<ToastrComponent message={warning} />, {
    position: toast.POSITION.BOTTOM_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="warning" />,
    closeButton: (closeToast) => getToasterCloseButton({ closeToast, type: "warning" }),
    hideProgressBar: true
  });
};

const showInfoToastr = info => {
  toast.info(<ToastrComponent message={info} />, {
    position: toast.POSITION.BOTTOM_CENTER,
    transition: Slide,
    theme: "colored",
    icon: <GetToasterIcon type="info" />,
    closeButton: (closeToast) => getToasterCloseButton({ closeToast, type: "info" }),
    hideProgressBar: true
  });
};

export const Toastr = {
  success: showToastr,
  error: showErrorToastr,
  warning: showWarningToastr,
  info: showInfoToastr
};

export default Toastr;
