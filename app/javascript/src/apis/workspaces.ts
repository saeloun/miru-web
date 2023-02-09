import axios from "./api";

const path = "/workspaces";

const get = async () => await axios.get(path);

const update = async id => await axios.put(`${path}/${id}`);

const WorkspaceApi = { get, update };

export default WorkspaceApi;
