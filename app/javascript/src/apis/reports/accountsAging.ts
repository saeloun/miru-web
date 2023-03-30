import axios from "../api";

const path = "/reports/accounts_aging";

const get = () => axios.get(path);

const accountsAgingApi = { get };

export default accountsAgingApi;
