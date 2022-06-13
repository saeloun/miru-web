import axios from "axios";

const path = "/profiles/bank_account_details";

const get = async () => axios.get(path);

const post = async (body) => axios.post(path, body);

const put = async (id, body) => axios.put(`${path}/${id}`, body);

const profilesApi = { get, post, put };

export default profilesApi;
