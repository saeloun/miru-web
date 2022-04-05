import React from "react";

import { toast, Slide } from "react-toastify";

const ToastrComponent = ({ message }) => (
  <div className="flex flex-row items-start justify-start">
    <p className="mx-4 font-medium leading-5 text-white">{message}</p>
  </div>
);

const showToastr = message => {
  toast.success(<ToastrComponent message={message} />, {
    position: toast.POSITION.BOTTOM_CENTER,
    transition: Slide,
    theme: "colored"
  });
};

const isError = e => e && e.stack && e.message;

const showErrorToastr = error => {
  const errorMessage = isError(error) ? error.message : error;
  toast.error(<ToastrComponent message={errorMessage} />, {
    position: toast.POSITION.BOTTOM_CENTER,
    transition: Slide,
    theme: "colored"
  });
};

export const Toastr = {
  success: showToastr,
  error: showErrorToastr
};

export default Toastr;
