import axios from "axios";

const path = "/leads/allowed_users";

const get = async () => axios.get(`${path}`);

const leadAllowedUsersApi = { get };

export default leadAllowedUsersApi;
