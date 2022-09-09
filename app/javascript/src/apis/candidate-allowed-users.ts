import axios from "axios";

const path = "/recruitments/candidates/allowed_users";

const get = async () => axios.get(`${path}`);

const candidateAllowedUsersApi = { get };

export default candidateAllowedUsersApi;
