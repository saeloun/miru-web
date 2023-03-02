import axios from "./api";

const signin = payload => axios.post("/users/login", { user: payload });

const signup = payload => axios.post("/users/signup", { user: payload });

const logout = () => axios.delete("/users/logout");

const forgotPassword = payload =>
  axios.post("/users/forgot_password", { user: payload });

const resetPassword = payload =>
  axios.put("/users/reset_password", { user: payload });

const sendEmailConfirmation = payload =>
  axios.post(`/users/resend_confirmation_email`, { user: payload });

const googleAuth = () =>
  axios
    .create({
      baseURL: "/",
    })
    .post("users/auth/google_oauth2");

const authenticationApi = {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  googleAuth,
  logout,
  sendEmailConfirmation,
};

export default authenticationApi;
