import axios from "axios";

const path = "/projects";

const get = async () => axios.get(`${path}`);

const projects = { get };

export default projects;
