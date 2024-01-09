import axios from "./api";

const path = "/expenses";

const index = async () => await axios.get(path);

const create = async payload => await axios.post(path, payload);

const show = async id => await axios.get(`${path}/${id}`);

// const update = async (id, payload) => axios.post(`${path}/${id}`, payload);

const categories = () => axios.get("/expense_categories");

const expensesApi = {
  index,
  create,
  show,
  categories,
};

export default expensesApi;
