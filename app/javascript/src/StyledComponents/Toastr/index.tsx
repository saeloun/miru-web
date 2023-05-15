import React from "react";

import { XIcon } from "miruIcons";
import { toast, Slide } from "react-toastify";

import { GetToasterIcon } from "constants/index";

import Toast from "./Toast";

const TOAST_CONFIG = {
  autoClose: 2000,
  transition: Slide,
  position: toast.POSITION.BOTTOM_CENTER,
  hideProgressBar: true,
  closeButton: ({ closeToast, ...props }) => (
    <XIcon
      className="miru-ui-toastr__close-button"
      color="#10562C"
      onClick={closeToast}
      {...props}
    />
  ),
  className: "miru-ui-toastr",
};

const showSuccessToastr = message => {
  toast.success(<Toast message={message} />, {
    ...TOAST_CONFIG,
    icon: <GetToasterIcon type="success" />,
  });
};

const isError = e => e && e.stack && e.message;
const isString = e => typeof e === "string" || e instanceof String;
const isArray = e => Array.isArray(e);

const showErrorToastr = error => {
  let errorMessage;

  if (isError(error)) {
    errorMessage = error;
  } else if (isString(error)) {
    errorMessage = error;
  } else if (isArray(error)) {
    errorMessage = error[0];
  } else {
    errorMessage = Object.values(error)[0];
  }

  toast.error(<Toast message={errorMessage} />, {
    ...TOAST_CONFIG,
    icon: <GetToasterIcon type="error" />,
  });
};

export const Toastr = {
  success: showSuccessToastr,
  error: showErrorToastr,
};

export default Toastr;
