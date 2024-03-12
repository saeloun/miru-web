import axios from "../api";

const path = "/reports/outstanding_overdue_invoices/";

const get = (queryParams?: string) => axios.get(`${path}${queryParams || ""}`);

const reports = { get };

export default reports;
