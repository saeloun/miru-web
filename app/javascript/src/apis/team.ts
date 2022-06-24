import axios from "axios";

const path = "/team";

const get = () => axios.get(path);

const destroy = id => axios.delete(`${path}/${id}`);

const put = (id,payload) => axios.put(`${path}/${id}`,payload);

//TODO: connect Invitation flow
const post = payload => { console.log(payload, "invite user"); return true}; // eslint-disable-line
// const post = payload => axios.post(`${path}`, payload);

export {
  get,
  destroy,
  put,
  post
};
