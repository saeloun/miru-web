import axios from "./api";

const path = "/expenses";

const index = (query = "") => axios.get(query ? `${path}?${query}` : path);

const create = payload =>
  axios.post(path, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

const show = async id => await axios.get(`${path}/${id}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const createCategory = async payload =>
  axios.post("/expense_categories", payload);

const createVendors = async payload => axios.post("/vendors", payload);

const expensesApi = {
  index,
  create,
  show,
  update,
  destroy,
  createCategory,
  createVendors,
};

export default expensesApi;
