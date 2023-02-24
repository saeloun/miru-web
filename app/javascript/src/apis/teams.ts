import axios from "./api";

const get = async id => axios.get(`team/${id}/details`);

const updateUser = (userId, payload) =>
  axios.put(`team/${userId}/details`, payload);

const getAddress = async userId => axios.get(`users/${userId}/addresses`);

const updateAddress = (userId, addrId, payload) =>
  axios.put(`users/${userId}/addresses/${addrId}`, payload);

const teamsApi = { get, getAddress, updateUser, updateAddress };

export default teamsApi;
