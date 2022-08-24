import axios from "axios";

const path = "/engagements/items";

const get = async () => axios.get(`${path}`);

const engagementsItemsApi = { get };

export default engagementsItemsApi;
