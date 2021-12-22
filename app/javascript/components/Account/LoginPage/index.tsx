import * as React from "react";

import authApi from "../../apis/auth";
import { setAuthHeaders } from "../../apis/axios";

import Container from "../../Container";

import { setToLocalStorage } from "../../helpers/storage";

const LoginPage = () => {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const response = await authApi.login({ email, password });
      setToLocalStorage({
        isLoggedIn: true,
        token: response.data.token,
        email
      });
      setAuthHeaders();
      window.location.href = "/";
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Container>
      <h2 className="font-medium text-center text-3xl lg:text-4xl text-mirublack-1000 mb-5">
        Miru
      </h2>
      <div className="p-5 2xl:p-10 shadow-xl rounded-lg">
        <h2 className="text-miru-1000 lg:mb-3 text-base font-medium">
          Sign In
        </h2>

        <form>
          <div className="field">
            <label className="text-xs text-mirublack-1000" htmlFor="email">
              Email
            </label>
            <br />
            <input
              className="h-8 w-full focus:outline-none bg-mirugrey-200 text-sm"
              id="email"
              type="text"
              placeholder="Enter Email"
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-3">
            <div className="field">
              <label className="text-xs text-mirublack-1000" htmlFor="password">
                Password
              </label>
              <br />
              <input
                className="h-8 w-full focus:outline-none bg-mirugrey-200 text-sm"
                id="password"
                type="password"
                placeholder="Enter Password"
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="actions">
            <button
              className="h-8 mt-6 w-full bg-mirugrey-400 font-bold text-white text-base hover:bg-mirublack-1000"
              onClick={handleSubmit}
            >
              SIGN IN
            </button>
          </div>
        </form>
        <div className="mt-3 text-center">
          <a
            className="text-center text-mirugrey-400 text-xs hover:text-mirublack-1000"
            href="#"
          >
            Forgot Password?
          </a>
        </div>
        <div className="text-center">
          <p className="text-center text-mirugrey-400 text-xs hover:text-mirublack-1000">
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default LoginPage;
