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
      baseURL: "/internal_api/v1",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document
          .querySelector('[name="csrf-token"]')
          .getAttribute("content"),
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
          clearCredentialsFromLocalStorage();
          Toastr.error(error.response?.data?.error);
          setTimeout(() => (window.location.href = "/"), 500);
        }

        // Skip generic toast if field_errors are present (handled by the component)
        if (!error.response?.data?.field_errors) {
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
      async (config: any) => {
        const token = getValueFromLocalStorage("authToken");
        const email = getValueFromLocalStorage("authEmail");
        const headers = {
          "X-Auth-Email": email,
          "X-Auth-Token": token,
        };

        const newConfig = {
          ...config,
          headers: {
            ...config.headers,
            ...headers,
          },
        };

        return newConfig;
      },
      (error: any) => Promise.reject(error)
    );
  }
}

const Api = new ApiHandler();

export default Api.axios;
