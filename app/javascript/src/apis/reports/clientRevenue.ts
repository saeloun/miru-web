import axios from "../api";

const path = "/reports/client_revenues/";

const get = (from, to, clientIds) =>
  axios.get(
    `${path}?duration_from=${from}&duration_to=${to}&client_ids=[${clientIds}]`
  );

const newReport = async () => axios.get(`${path}new`);

const download = (type, queryParams) =>
  axios({
    method: "GET",
    url: `${path}/download.${type}${queryParams}`,
    responseType: "blob",
  });

const clientRevenueApi = { get, newReport, download };

export default clientRevenueApi;
