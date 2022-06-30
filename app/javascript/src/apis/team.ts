import axios from "axios";

const path = "/team";
const userInvitePath = "users/invitation/";

const get = () => axios.get(path);

const destroy = id => axios.delete(`${path}/${id}`);

const put = (id,payload) => axios.put(`${path}/${id}`,payload);

const invite = payload => axios({
  method: "post",
  url: userInvitePath,
  data: {
    user: {
      email: payload.email,
      roles: payload.role,
      first_name: payload.firstName,
      last_name: payload.lastName
    }
  },
  baseURL: "/"
});

export {
  get,
  destroy,
  put,
  invite
};
