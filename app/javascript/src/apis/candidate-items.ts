import axios from "axios";

const path = "/recruitments/candidates/items";

const get = async () => axios.get(`${path}`);

const candidateItemsApi = { get };

export default candidateItemsApi;
