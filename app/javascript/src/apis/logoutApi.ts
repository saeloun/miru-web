import axios from "./api";

export const logoutApi = () => axios.delete("/users/logout");
