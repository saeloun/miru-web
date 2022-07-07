import axios from "axios";

const path = "/reports/time_entries/";

const get = (queryParams) => axios.get(`${path}${queryParams}`);

const download = (type, queryParams) => axios({
  method: "GET",
  url: `${path}/download.${type}${queryParams}`,
  responseType: "blob"
});

const reports = { get, download };

export default reports;
