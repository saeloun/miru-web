import axios from "axios";

const path = "/user";

const destroy = () => axios.delete(`${path}/signout`);

const userApi = { destroy };

export default userApi;
