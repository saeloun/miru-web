import axios from "axios";

const path = "/time-tracking";

const get = async () => axios.get(path);

export default { get };
