import axios from "axios";

const path = "/company_users";

const get = async () => axios.get(`${path}`);

const companyUsersApi = { get };

export default companyUsersApi;
