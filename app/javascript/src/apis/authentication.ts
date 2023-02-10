import axios from "./api";

const signin = payload => axios.post("/login", { user: payload });

const signup = payload => axios.post("/signup", { user: payload });

const logout = () => axios.delete("/logout");

const forgotPassword = payload =>
  axios.post("/forgot_password", { user: payload });

const resetPassword = payload =>
  axios.put("/reset_password", { user: payload });

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
  logout
};

export default authenticationApi;
