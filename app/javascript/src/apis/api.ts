import axios from "axios";

import Toastr from "common/Toastr";
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
          response.success = response.status === 200;
          const data = response.data;
          if (data && !data.reset_session && data.notice) {
            Toastr.success(data.notice);
          }
        }

        return response;
      },
      (error: any) => {
        if (error.response?.status === 401) {
          clearCredentialsFromLocalStorage();
          Toastr.error(error.response?.data?.error);
          setTimeout(() => (window.location.href = "/"), 3000);
        }

        Toastr.error(
          error.response?.data?.errors ||
            error.response?.data?.error ||
            error.response?.data?.notice ||
            error.message ||
            error.notice ||
            "Something went wrong!"
        );
        if (error.response?.status === 423) {
          setTimeout(() => (window.location.href = "/"), 3000);
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
