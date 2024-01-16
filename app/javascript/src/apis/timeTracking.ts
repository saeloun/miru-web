import axios from "./api";

const path = "/time-tracking";

const get = async () => axios.get(path);

const getCurrentUserEntries = (from, to, year, uid) =>
  axios.get(`${path}?from=${from}&to=${to}&year=${year}&user_id=${uid}`);

const timeTrackingApi = { get, getCurrentUserEntries };

export default timeTrackingApi;
