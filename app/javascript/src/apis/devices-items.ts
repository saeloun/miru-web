import axios from "axios";

const path = "/devices/items";

const get = async () => axios.get(`${path}`);

const devicesItemsApi = { get };

export default devicesItemsApi;
