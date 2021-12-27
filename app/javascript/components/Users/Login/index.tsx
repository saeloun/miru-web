import * as React from "react";
import { Link } from "react-router-dom";

import authApi from "apis/auth";
import { setAuthHeaders } from "apis/axios";
import Container from "components/Container";
import { setToLocalStorage } from "helpers/storage";

import LoginForm from "./LoginForm";

const Login = () => {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const response = await authApi.login({ users: { email, password } });
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
      <h2 className="font-medium text-center text-3xl lg:text-4xl text-miru-1000 mb-5">
        Miru
      </h2>
      <div className="p-5 2xl:p-10 shadow-xl rounded-lg">
        <h2 className="text-miru-1000 lg:mb-3 text-base font-medium">
          Sign In
        </h2>
        <LoginForm
          setEmail={setEmail}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
        />
        <div className="mt-3 text-center">
          <Link
            to="/users/password/reset"
            className="text-center text-miru-400 text-xs hover:text-miru-1000"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="text-center">
          <p className="text-center text-miru-400 text-xs">
            Don't have an account?{" "}
            <Link to="/signup" className="text-miru-800 hover:text-miru-1000">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default Login;
