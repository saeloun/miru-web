import axios from "./api";

const get = (userId, year) =>
  axios.get(`/timeoff_entries?user_id=${userId}&year=${year}`);

const timeoffEntryApi = {
  get,
};

export default timeoffEntryApi;
