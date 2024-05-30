import axios from "../api";

const path = "/reports/outstanding_overdue_invoices/";

const get = () => axios.get(path);

const download = type =>
  axios({
    method: "GET",
    url: `${path}/download.${type}`,
    responseType: "blob",
  });

const reports = { get, download };

export default reports;
