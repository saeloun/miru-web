import axios, { HeadersDefaults } from "axios";
import Toastr from "../Common/Toastr";
import { setToLocalStorage, getFromLocalStorage } from "../helpers/storage";

axios.defaults.baseURL = "/";

interface CommonHeaderProperties extends HeadersDefaults {
  Authorization: string;
  "Content-Type": string;
  "X-CSRF-TOKEN": string;
}

export const setAuthHeaders = (setLoading = (value: boolean): any => null) => {
  axios.defaults.headers = {
    Authorization: `Bearer ${getFromLocalStorage("authToken")}`,
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector("[name=\"csrf-token\"]")
      .getAttribute("content")
  } as CommonHeaderProperties;
  setLoading(false);
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
    setToLocalStorage({
      email: null,
      isLoggedIn: false,
      token: null
    });
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

export const resetAuthTokens = () => {
  delete axios.defaults.headers["Authorization"];
};
