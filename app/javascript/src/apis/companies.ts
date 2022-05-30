import axios from "axios";

const path = "/companies";

const index = () => axios.get(path);

const create = payload => axios.post(path, payload);

const update = payload => axios.put(path, payload);

const companiesApi = {
  index,
  create,
  update
};

export default companiesApi;
