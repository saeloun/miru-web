import axios from "axios";

const path = "/projects";

const get = async () => axios.get(`${path}`);

const show = async id => axios.get(`${path}/${id}`);

const projectApi = { get, show };

export default projectApi;
