import axios from "axios";

const path = "/reports";

const get = async () => axios.get(`${path}`);

const create = async ({ payload }) => axios.post("internal_api/v1/reports", payload);

const reports = { get, create };

export default reports;
