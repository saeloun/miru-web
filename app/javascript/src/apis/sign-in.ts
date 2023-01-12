import axios from "axios";

const path = "/users/sign_in";

const post = async body => axios.post(path, body);

const signInApi = { post };

export default signInApi;
