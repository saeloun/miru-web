import axios from "axios";

const path = "/wise";

const createRecipient = async (payload) => axios.post(`${path}/create_recipient`, payload);

const updateRecipient = async (payload) => axios.put(`${path}/update_recipient`, payload);

const fetchAccountRequirements = async (sourceCurrency, targetCurrency) => {
  const query = `source_currency=${sourceCurrency}&target_currency=${targetCurrency}&source_amount=1000`;

  return axios.get(
    `${path}/fetch_bank_requirements?${query}`
  );
};

const fetchCurrencies = async () => axios.get(`${path}/fetch_currencies`);

const fetchRecipient = async (recipientId) => axios.get(`${path}/fetch_recipient?recipient_id=${recipientId}`);

const validateAccountDetail = async (url) => {
  const { pathname, search } = new URL(url);

  return axios.get(`${path}/validate_account_details?pathname=${pathname}&search=${search}`);
};

const wiseApi = {
  createRecipient, fetchAccountRequirements, fetchCurrencies, validateAccountDetail, fetchRecipient, updateRecipient
};

export default wiseApi;
