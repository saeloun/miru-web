import axios from "axios";

const path = "/payments/providers";

const get = () => axios.get(path);
const update = (id, provider) => axios.patch(`${path}/${id}`, provider);

const PaymentsProviders = {
  get,
  update,
};

export default PaymentsProviders;
