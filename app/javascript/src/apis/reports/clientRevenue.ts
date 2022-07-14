import axios from "axios";

const path = "/reports/client_revenues/";

const get = () => axios.get(`${path}`);

const reports = { get };

export default reports;
