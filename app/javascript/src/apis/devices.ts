import axios from "./api";

const get = async userId => axios.get(`/users/${userId}/devices`);

const post = async (userId, payload) =>
  axios.post(`/users/${userId}/devices`, payload);

const deviceApi = { get, post };

export default deviceApi;
