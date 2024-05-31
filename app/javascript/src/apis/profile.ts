import axios from "./api";

const path = "/profile";

const update = payload => axios.put(`${path}`, payload);

const updateAvatar = (payload, config) => axios.put(`${path}`, payload, config);

const removeAvatar = () => axios.delete(`${path}/remove_avatar`);

const profileApi = {
  update,
  removeAvatar,
  updateAvatar,
};

export default profileApi;
