import axios from "axios";

const path = "/employments";

const get = async () => axios.get(`${path}`);

const companyUsersApi = { get };

export default companyUsersApi;
