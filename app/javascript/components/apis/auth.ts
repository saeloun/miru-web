import axios from "axios";

const login = payload => axios.post("/users/sign_in", payload);
const signup = payload => axios.post("/users/sign_up", payload);
const reset_password = payload => axios.post("users/password", payload);
const set_password = payload => axios.put("users/password", payload);

const authApi = {
  login,
  signup,
  reset_password,
  set_password
};

export default authApi;
