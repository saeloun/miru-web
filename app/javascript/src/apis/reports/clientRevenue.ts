import axios from "axios";

const path = "/reports/client_revenues/";

const get = (from, to, clientIds) =>
  axios.get(
    `${path}?duration_from=${from}&duration_to=${to}&client_ids=[${clientIds}]`
  );

const clientRevenueApi = { get };

export default clientRevenueApi;
