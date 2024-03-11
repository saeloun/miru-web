import axios from "../api";

const path = "/reports/accounts_aging";

const get = () => axios.get(path);

const download = (type, queryParams) =>
  axios({
    method: "GET",
    url: `${path}/download.${type}${queryParams}`,
    responseType: "blob",
  });

const accountsAgingApi = { get, download };

export default accountsAgingApi;
