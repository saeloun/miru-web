import axios from "axios";

const path = "/profile/edit";

const get = async (userId) => axios.get(`${path}/${userId}/team_members`);

const update = async (userId, payload) => axios.patch(`${path}/${userId}/team_members`, payload);

const teamMemberApi = {
  get,
  update
};

export default teamMemberApi;
