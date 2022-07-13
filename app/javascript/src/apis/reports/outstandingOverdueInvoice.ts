import axios from "axios";

const path = "/reports/outstanding_overdue_invoices/";

const get = () => axios.get(`${path}`);

const reports = { get };

export default reports;
