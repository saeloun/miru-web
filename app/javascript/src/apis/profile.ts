import axios from "./api";

const path = "/profile";

const index = () => axios.get(path);

const getAddress = id => axios.get(`/users/${id}/addresses`);

const update = payload => axios.put(`${path}`, payload);

const updateAddress = (userId, addressId, payload) =>
  axios.put(`/users/${userId}/addresses/${addressId}`, payload);

const removeAvatar = () => axios.delete(`${path}/remove_avatar`);

const profileApi = {
  index,
  update,
  removeAvatar,
  getAddress,
  updateAddress,
};

export default profileApi;
