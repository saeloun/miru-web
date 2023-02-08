/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { HeadersDefaults } from "axios";

import Toastr from "common/Toastr";
import { getFromLocalStorage } from "utils/storage";

axios.defaults.baseURL = "/internal_api/v1";

interface CommonHeaderProperties extends HeadersDefaults {
  Accept: string;
  "Content-Type": string;
  "X-CSRF-TOKEN": string;
}

const setAuthHeaders = () => {
  axios.defaults.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector('[name="csrf-token"]')
      .getAttribute("content"),
  } as CommonHeaderProperties;
};

// const setAuthHeaders = () => {
//   axios.defaults.headers = {
//     // @ts-ignore
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     "X-CSRF-TOKEN": document
//       .querySelector('[name="csrf-token"]')
//       .getAttribute("content"),
//   };
//   const token = getFromLocalStorage("authToken");
//   const email = getFromLocalStorage("authEmail");
//   if (token && email) {
//     axios.defaults.headers["X-Auth-Email"] = email;
//     axios.defaults.headers["X-Auth-Token"] = token;
//   }
// };

const resetAuthTokens = () => {
  delete axios.defaults.headers["X-Auth-Email"];
  delete axios.defaults.headers["X-Auth-Token"];
};

const handleSuccessResponse = response => {
  if (response) {
    response.success = response.status === 200;
    if (response?.data?.notice) {
      Toastr.success(response.data.notice);
    }

    if (response?.data?.redirect_route) {
      window.location.href = response.data.redirect_route;
    }
  }

  return response;
};

const handleErrorResponse = (error) => {
  Toastr.error(
    error.response?.data?.errors ||
      error.response?.data?.error ||
      error.response?.data?.notice ||
      error.message ||
      error.notice ||
      "Something went wrong!"
  );
  if (error.response?.status === 423) {
    window.location.href = "/";
  }

  return Promise.reject(error);
};

const registerIntercepts = () => {
  axios.interceptors.response.use(handleSuccessResponse, error =>
    handleErrorResponse(error)
  );
};

export { setAuthHeaders, registerIntercepts, resetAuthTokens };
