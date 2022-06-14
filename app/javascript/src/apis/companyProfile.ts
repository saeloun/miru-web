import axios from "axios";

const path = "/timezones";

const get = async () => axios.get(`${path}`);

const companyProfileApi = { get };

export default companyProfileApi;
