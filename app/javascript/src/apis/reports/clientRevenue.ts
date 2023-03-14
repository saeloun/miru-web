import axios from "../api";

const path = "/reports/client_revenues/";

const get = (from, to, clientIds) =>
  axios.get(
    `${path}?duration_from=${from}&duration_to=${to}&client_ids=[${clientIds}]`
  );

const newReport = async() => axios.get(`${path}new`);

const clientRevenueApi = { get, newReport };

export default clientRevenueApi;
