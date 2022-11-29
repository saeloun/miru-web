import axios from "axios";

const path = "/profile";

const index = () => axios.get(path);

const update = payload => axios.put(`${path}`, payload);

const removeAvatar = () => axios.delete(`${path}/remove_avatar`);

const profileApi = {
  index,
  update,
  removeAvatar,
};

export default profileApi;
