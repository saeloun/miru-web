import axios from "axios";

import Toastr from "common/Toastr";

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
          if (response?.data?.notice) {
            Toastr.success(response.data.notice);
          }
        }

        return response;
      },
      (error: any) => {
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
      }
    );

    this.axios.interceptors.request.use(
      async (config: any) => {
        // add token headers in below header constant.
        // example
        const headers = {
          'X-Auth-Email': 'vipul@example.com',
          'X-Auth-Token': 'nyDMsho2Pr2Zgk7dXyf6XEXsf3QLAsrhTUQW1aybMxymSJVACo',
        };

        // const headers = {};

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
