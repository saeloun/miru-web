import axios from "axios";

const path = "/team";

const get = () => axios.get(path);

const destroy = id => axios.delete(`${path}/${id}`);

export {
  get,
  destroy
};
