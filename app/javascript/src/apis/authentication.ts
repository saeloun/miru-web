import axios from "./api";

const authApi = axios.create({
  baseURL: "/internal_api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector('[name="csrf-token"]')
      .getAttribute("content"),
  },
});

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
