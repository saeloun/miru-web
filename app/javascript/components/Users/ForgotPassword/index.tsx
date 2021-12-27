import * as React from "react";
import { Link } from "react-router-dom";

import authApi from "components/apis/auth";

import Container from "components/Container";
import ForgotPasswordForm from "./ForgotPasswordForm";

const ForgotPassword = () => {
  const [email, setEmail] = React.useState<string>("");

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const response = await authApi.reset_password({ user: { email } });
      console.log(response);
      window.location.href = "/login";
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
          Forgot Password
        </h2>
        <ForgotPasswordForm setEmail={setEmail} handleSubmit={handleSubmit} />
        <div className="text-center m-2">
          <p className="text-center text-miru-400 text-xs hover:text-miru-1000">
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default ForgotPassword;
