/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { HeadersDefaults } from "axios";

import Toastr from "common/Toastr";

axios.defaults.baseURL = "/internal_api/v1";

// interface CommonHeaderProperties extends HeadersDefaults {
//   Accept: string;
//   "Content-Type": string;
//   "X-CSRF-TOKEN": string;
//   "X-Auth-Email": string;
//   "X-Auth-Token": string;
// }

// const setAuthHeaders = () => {
//   axios.defaults.headers = {
//     Accept: "application/json",
//     "Content-Type": "application/json",
//     "X-CSRF-TOKEN": document
//       .querySelector('[name="csrf-token"]')
//       .getAttribute("content"),
//     "X-Auth-Email": "supriya@example.com",
//     "X-Auth-Token": "KQhEfwe7rDPcxUaxs8Bo8d1yVeGYJE5v8R5KbhRWjJJr2jnfon"
//   } as CommonHeaderProperties;
// };

const setAuthHeaders = () => {
  axios.defaults.headers = {
    // @ts-ignore
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector('[name="csrf-token"]')
      .getAttribute("content"),
    "X-Auth-Email": "supriya@example.com",
    "X-Auth-Token": "KQhEfwe7rDPcxUaxs8Bo8d1yVeGYJE5v8R5KbhRWjJJr2jnfon",
  };
  console.log("hello", axios.defaults.headers)
};

const handleSuccessResponse = response => {
  if (response) {
    response.success = response.status === 200;
    if (response?.data?.notice) {
      Toastr.success(response.data.notice);
    }
  }

  return response;
};

const handleErrorResponse = error => {
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

export { setAuthHeaders, registerIntercepts };
