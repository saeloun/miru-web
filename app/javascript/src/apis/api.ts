import axios from "axios";
import { Toastr } from "StyledComponents";

import {
  clearCredentialsFromLocalStorage,
  getValueFromLocalStorage,
} from "utils/storage";

class ApiHandler {
  axios: any;
  constructor() {
    this.axios = axios.create({
      baseURL: "/api/v1",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document
          .querySelector('[name="csrf-token"]')
          ?.getAttribute("content") || "",
      },
    });

    this.axios.interceptors.response.use(
      (response: any) => {
        if (response) {
          const { data, status } = response;
          response.success = status === 200;
          const { reset_session, notice } = data;
          if (data && !reset_session && notice) {
            Toastr.success(notice);
          }
        }

        return response;
      },
      (error: any) => {
        if (error.response?.status === 401) {
          // Only clear credentials and redirect if we actually had credentials
          const token = getValueFromLocalStorage("authToken");
          if (token) {
            clearCredentialsFromLocalStorage();
            Toastr.error(
              error.response?.data?.error ||
                "Session expired. Please login again."
            );
            setTimeout(() => (window.location.href = "/"), 500);
          }

          // If no token, just reject the error without redirecting
          return Promise.reject(error);
        }

        // Only show error toasts for non-401 errors
        if (error.response?.status !== 401) {
          Toastr.error(
            error.response?.data?.errors ||
              error.response?.data?.error ||
              error.response?.data?.notice ||
              error.message ||
              error.notice ||
              "Something went wrong!"
          );
        }

        if (error.response?.status === 423) {
          setTimeout(() => (window.location.href = "/"), 500);
        }

        return Promise.reject(error);
      }
    );

    this.axios.interceptors.request.use(
      async (config: any) =>
        // Authentication is handled by cookies now, no need to add headers
        config,
      (error: any) => Promise.reject(error)
    );
  }
}

const Api = new ApiHandler();

export default Api.axios;
