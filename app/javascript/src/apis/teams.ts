import axios from "./api";

const get = async id => axios.get(`team/${id}/details`);

const updateUser = (userId, payload) =>
  axios.put(`team/${userId}/details`, payload);

const getAddress = async userId => axios.get(`users/${userId}/addresses`);
const createAddress = (userId, payload) =>
  axios.post(`/users/${userId}/addresses`, payload);

const updateAddress = (userId, addrId, payload) =>
  axios.put(`users/${userId}/addresses/${addrId}`, payload);

const getEmployments = async () => axios.get(`employments`);

const getEmploymentDetails = async id => axios.get(`employments/${id}`);

const updateEmploymentDetails = async (id, payload) =>
  axios.patch(`employments/${id}`, payload);

const getPreviousEmployments = async id =>
  axios.get(`users/${id}/previous_employments`);

const updatePreviousEmployments = async (id, payload) =>
  axios.put(`bulk_previous_employments/${id}`, payload);

const teamsApi = {
  get,
  getAddress,
  updateUser,
  updateAddress,
  createAddress,
  getEmployments,
  getEmploymentDetails,
  updateEmploymentDetails,
  getPreviousEmployments,
  updatePreviousEmployments,
};

export default teamsApi;
