import axios from "axios";

const path = "/internal_api/v1/timezones";

const get = async () => axios.get(`${path}`);

const companyProfileApi = { get };

export default companyProfileApi;
