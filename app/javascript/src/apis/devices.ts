import axios from "./api";

const getPath = user_id => `/users/${user_id}/devices`;

const get = async user_id => axios.get(getPath(user_id));

const deviceApi = { get };

export default deviceApi;
