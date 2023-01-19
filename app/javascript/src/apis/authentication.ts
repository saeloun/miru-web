import axios from "axios";

const signin = payload => axios.post("/login", { user: payload });

const signup = payload => axios.post("/signup", { user: payload });

const forgotPassword = payload =>
  axios.post("/forgot_password", { user: payload });

const resetPassword = payload =>
  axios.put("/reset_password", { user: payload });

const authenticationApi = {
  signin,
  signup,
  forgotPassword,
  resetPassword,
};

export default authenticationApi;
