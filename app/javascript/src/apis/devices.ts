import axios from "./api";

const get = async userId => axios.get(`/users/${userId}/devices`);

const deviceApi = { get };

export default deviceApi;
