import axios from "axios";

const path = "/leads/items";

const get = async () => axios.get(`${path}`);

const leadItemsApi = { get };

export default leadItemsApi;
