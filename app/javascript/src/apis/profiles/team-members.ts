import axios from "axios";

const path = "/profiles/team_members";

const get = async () => axios.get(path);

const update = async (payload) => axios.patch(path, payload);

const teamMemberApi = {
  get,
  update
};

export default teamMemberApi;
