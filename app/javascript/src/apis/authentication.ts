import api from "./api";

// Use the modern API client directly - it handles CSRF tokens, auth headers, and base URL automatically
const signin = payload => api.post("/users/login", { user: payload });

const signup = payload => api.post("/users/signup", { user: payload });

const forgotPassword = payload =>
  api.post("/users/forgot_password", { user: payload });

const resetPassword = payload =>
  api.put("/users/reset_password", { user: payload });

const sendEmailConfirmation = payload =>
  api.post(`/users/resend_confirmation_email`, { user: payload });

const googleAuth = async () => {
  const response = await fetch("/users/auth/google_oauth2", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    credentials: "same-origin",
  });

  return response.json();
};

const authenticationApi = {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  googleAuth,
  sendEmailConfirmation,
};

export default authenticationApi;
