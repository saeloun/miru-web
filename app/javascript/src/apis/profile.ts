import axios from "./api";

const path = "/profile";

const update = payload => axios.put(`${path}`, payload);

const profileApi = {
  update,
};

export default profileApi;
