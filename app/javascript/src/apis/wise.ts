import axios from "axios";

const path = "/wise";

// Currency APIs
const fetchCurrencies = async () => axios.get(`${path}/currencies`);

// Recipient APIs
const fetchRecipient = async (recipientId) =>
  axios.get(`${path}/recipients/${recipientId}`);

const createRecipient = async (payload) =>
  axios.post(`${path}/recipients`, payload);

const updateRecipient = async (payload) =>
  axios.put(`${path}/recipients/${payload["id"]}`, payload);

// Bank Apis
const fetchAccountRequirements = async (sourceCurrency, targetCurrency) => {
  const query = `source_currency=${sourceCurrency}&target_currency=${targetCurrency}&source_amount=1000`;

  return axios.get(`${path}/fetch_bank_requirements?${query}`);
};

const validateAccountDetail = async (url) => {
  const { pathname, search } = new URL(url);

  return axios.get(
    `${path}/validate_account_details?pathname=${pathname}&search=${search}`
  );
};

const wiseApi = {
  createRecipient,
  fetchAccountRequirements,
  fetchCurrencies,
  validateAccountDetail,
  fetchRecipient,
  updateRecipient,
};

export default wiseApi;
