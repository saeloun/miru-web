import axios from "./api";

const authApi = axios.create({
  baseURL: "/internal_api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add request interceptor to set CSRF token dynamically
authApi.interceptors.request.use(
  config => {
    // Get CSRF token at request time, not module load time
    const csrfToken = document
      .querySelector('[name="csrf-token"]')
      ?.getAttribute("content");

    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    return config;
  },
  error => Promise.reject(error)
);

const signin = payload => authApi.post("/users/login", { user: payload });

const signup = payload => authApi.post("/users/signup", { user: payload });

const forgotPassword = payload =>
  authApi.post("/users/forgot_password", { user: payload });

const resetPassword = payload =>
  authApi.put("/users/reset_password", { user: payload });

const sendEmailConfirmation = payload =>
  axios.post(`/users/resend_confirmation_email`, { user: payload });

const googleAuth = () =>
  axios
    .create({
      baseURL: "/",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    })
    .get("users/auth/google_oauth2");

const authenticationApi = {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  googleAuth,
  sendEmailConfirmation,
};

export default authenticationApi;
