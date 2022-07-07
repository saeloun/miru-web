import axios from "axios";

const path = "/leads/timeline_items";

const get = async () => axios.get(`${path}`);

const leadTimelineItemsApi = { get };

export default leadTimelineItemsApi;
