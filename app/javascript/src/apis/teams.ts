import axios from "./api";

const get = async id => axios.get(`team/${id}/details`);

const updateUser = (user_id, payload) =>
  axios.put(`team/${user_id}/details`, payload);

const getAddress = async user_id => axios.get(`users/${user_id}/addresses`);

const updateAddress = (user_id, addr_id, payload) =>
  axios.put(`users/${user_id}/addresses/${addr_id}`, payload);

const teamsApi = { get, getAddress, updateUser, updateAddress };

export default teamsApi;
