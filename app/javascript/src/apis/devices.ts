import axios from "./api";

const get = async userId => axios.get(`/users/${userId}/devices`);

const update = async (userId, data) =>
  axios.patch(`/users/${userId}/devices`, data);

const deviceApi = { get, update };

export default deviceApi;
