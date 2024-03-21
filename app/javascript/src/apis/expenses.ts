import axios from "./api";

const path = "/expenses";

const index = async () => await axios.get(path);

const create = async payload => await axios.post(path, payload);

const show = async id => await axios.get(`${path}/${id}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const createCategory = async payload =>
  axios.post("/expense_categories", payload);

const expensesApi = {
  index,
  create,
  show,
  update,
  destroy,
  createCategory,
};

export default expensesApi;
