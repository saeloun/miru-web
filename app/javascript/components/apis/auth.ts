import axios from "axios";

const login = payload => axios.post("/users/sign_in", payload);

const authApi = {
  login
};

export default authApi;
