import axios from "./api";

const path = "/reports/time_entries";

const get = queryParams => axios.get(`${path}${queryParams}`);

const download = (type, queryParams) =>
  axios({
    method: "GET",
    url: `${path}/download.${type}${queryParams}`,
    responseType: "blob",
  });

const reportsApi = { get, download };

export default reportsApi;
