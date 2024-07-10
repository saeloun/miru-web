import axios from "./api";

const get = async userId =>
  axios.get(`team/${userId}/notification_preferences`);

const updatePreference = async (userId, payload) =>
  axios.patch(`team/${userId}/notification_preferences`, payload);

const preferencesApi = { get, updatePreference };

export default preferencesApi;
