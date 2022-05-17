import axios from "axios";

const path = "/payments/settings";

const get = async () => axios.get(`${path}`);

const connectStripe = async () => axios.post(`${path}/stripe/connect`);

const paymentSettings = { get, connectStripe };

export default paymentSettings;
