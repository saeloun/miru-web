import axios from "./api";

const path = "/project_members";

const update = async (id, payload) => axios.put(`${path}/${id}`, payload);

const projectMembersApi = { update };

export default projectMembersApi;
