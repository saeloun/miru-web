import axios from "./api";

const path = "/expenses";

const index = (query = "") => axios.get(query ? `${path}?${query}` : path);

const create = payload =>
  axios.post(path, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

const show = id => axios.get(`${path}/${id}`);

const update = (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = id => axios.delete(`${path}/${id}`);

const createCategory = payload => axios.post("/expense_categories", payload);

const createVendors = payload => axios.post("/vendors", payload);

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
