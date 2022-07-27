import axios from "axios";

const path = "/user";

const destroy = (id) => axios.delete(`${path}/signout`); // eslint-disable-line

const userApi = { destroy };

export default userApi;
