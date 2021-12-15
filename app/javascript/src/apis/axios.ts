import axios, { HeadersDefaults } from "axios";

axios.defaults.baseURL = "/";

interface CommonHeaderProperties extends HeadersDefaults {
  Authorization: string;
  Accept: string;
  "Content-Type": string;
  "X-CSRF-TOKEN": string;
}

export const setAuthHeaders = (setLoading = (value: boolean): any => null) => {
  axios.defaults.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector("[name=\"csrf-token\"]")
      .getAttribute("content")
  } as CommonHeaderProperties;
  setLoading(false);
};
