
import axios from "axios";

const path = "/current_workspace";

const users = async () => axios.get(`${path}/users`);

const workspaceApi = { users };

export default workspaceApi;
