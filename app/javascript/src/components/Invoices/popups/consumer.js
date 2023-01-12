import { createConsumer } from "@rails/actioncable";

// const {APP_BASE_URL, NODE_ENV} = process.env;

// const url = NODE_ENV === 'production' ? `wss://${APP_BASE_URL}/cable` : `ws://${APP_BASE_URL}/cable`;
// const consumer = createConsumer(url);
const isProd = process.env.NODE_ENV === "production";
const protocol = isProd ? "wss" : "ws";
const consumer = createConsumer(
  `${protocol}://${process.env.APP_BASE_URL}/cable`
);
export default consumer;
