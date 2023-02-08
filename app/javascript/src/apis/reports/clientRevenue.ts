import axios from "axios";

const path = "/reports/client_revenues/";

const get = (from, to, clientIds) =>
  axios.get(
    `${path}?duration_from=${from}&duration_to=${to}&client_ids=[${clientIds}]`
  );

const getOverdueAmount = axios.get("/reports/outstanding_overdue_invoices");

const clientRevenueApi = { get, getOverdueAmount };

export default clientRevenueApi;
