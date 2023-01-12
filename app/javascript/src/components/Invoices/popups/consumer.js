// Action Cable provides the framework to deal with WebSockets in Rails.
// You can generate new channels where WebSocket features live using the `bin/rails generate channel` command.

import { createConsumer } from "@rails/actioncable";

const URL = "ws://localhost:3000/cable";
const consumer = createConsumer(URL);
export default consumer;
