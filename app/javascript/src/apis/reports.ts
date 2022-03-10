import axios from "axios";

const path = "/reports";

const get = async () => axios.get(`${path}`);

const reports = { get };

export default reports;
