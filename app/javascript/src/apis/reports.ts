import axios from "axios";

const path = "/reports";

const get = (queryParams) => axios.get(`${path}${queryParams}`);

const reports = { get };

export default reports;
