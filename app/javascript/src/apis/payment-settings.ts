import axios from "axios";

const path = "/internal_api/v1/payments/settings/stripe/connect";

const connectStripe = async () => axios.post(`${path}`);

const paymentSettings = { connectStripe };

export default paymentSettings;
