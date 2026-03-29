import { toast } from "sonner";

const isError = e => e && e.stack && e.message;
const isString = e => typeof e === "string" || e instanceof String;
const isArray = e => Array.isArray(e);

const showSuccessToastr = message => {
  toast.success(message);
};

const showErrorToastr = error => {
  let errorMessage;

  if (isError(error)) {
    errorMessage = error.message || error.toString();
  } else if (isString(error)) {
    errorMessage = error;
  } else if (isArray(error)) {
    errorMessage = error[0];
  } else if (error && typeof error === "object") {
    errorMessage = Object.values(error)[0];
  } else {
    errorMessage = "An error occurred";
  }

  toast.error(errorMessage);
};

const showWarningToastr = message => {
  toast.warning(message);
};

const showInfoToastr = message => {
  toast.info(message);
};

export const Toastr = {
  success: showSuccessToastr,
  error: showErrorToastr,
  warning: showWarningToastr,
  info: showInfoToastr,
};

export default Toastr;
