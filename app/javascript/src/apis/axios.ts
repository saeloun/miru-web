/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { HeadersDefaults } from "axios";

import Toastr from "common/Toastr";

axios.defaults.baseURL = "/internal_api/v1";

interface CommonHeaderProperties extends HeadersDefaults {
  Accept: string;
  "Content-Type": string;
  "X-CSRF-TOKEN": string;
}

export const setAuthHeaders = () => {
  axios.defaults.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector("[name=\"csrf-token\"]")
      .getAttribute("content")
  } as CommonHeaderProperties;
};

const handleSuccessResponse = response => {
  if (response) {
    response.success = response.status === 200;
    if (response.data.notice) {
      Toastr.success(response.data.notice);
    }
  }
  return response;
};

const handleErrorResponse = error => {
  if (error.response?.status === 401) {
    window.location.href = "/login";
  }
  Toastr.error(
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

export const registerIntercepts = () => {
  axios.interceptors.response.use(handleSuccessResponse, error =>
    handleErrorResponse(error)
  );
};
