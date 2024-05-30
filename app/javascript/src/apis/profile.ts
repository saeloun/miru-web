import axios from "./api";

const path = "/profile";

const update = payload => axios.put(`${path}`, payload);

const updateAvatar = (payload, config) => axios.put(`${path}`, payload, config);

const createAddress = (userId, payload) =>
  axios.post(`/users/${userId}/addresses`, payload);

const updateAddress = (userId, addressId, payload) =>
  axios.put(`/users/${userId}/addresses/${addressId}`, payload);

const removeAvatar = () => axios.delete(`${path}/remove_avatar`);

const profileApi = {
  update,
  removeAvatar,
  updateAddress,
  createAddress,
  updateAvatar,
};

export default profileApi;
