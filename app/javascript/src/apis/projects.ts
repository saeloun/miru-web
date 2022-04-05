import axios from "axios";

const path = "/projects";

const get = async () => axios.get(`${path}`);

const show = async id => axios.get(`${path}/${id}`);

const updateMembers = async (id, payload)  => axios.put(`${path}/${id}/members`, payload);

const projectApi = { get, show, updateMembers };

export default projectApi;
