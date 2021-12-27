import * as React from "react";
import { Link } from "react-router-dom";

import authApi from "components/apis/auth";

import Container from "components/Container";
import SignupForm from "./SignupForm";

const Signup = () => {
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] =
    React.useState<string>("");

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const response = await authApi.signup({
        users: {
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          password_confirmation: passwordConfirmation
        }
      });
      window.location.href = "/login";
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container>
      <h2 className="font-medium text-center text-3xl lg:text-4xl text-miru-black-1000 mb-5">
        Miru
      </h2>
      <div className="p-5 2xl:p-10 shadow-xl rounded-lg">
        <h2 className="text-miru-black-1000 lg:mb-3 text-base font-medium">
          Sign up
        </h2>
        <SignupForm
          setFirstName={setFirstName}
          setLastName={setLastName}
          setEmail={setEmail}
          setPassword={setPassword}
          setPasswordConfirmation={setPasswordConfirmation}
          handleSubmit={handleSubmit}
        />
        <div className="text-center m-2">
          <p className="text-center text-miru-grey-400 text-xs">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-miru-grey-400 hover:text-miru-black-1000"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default Signup;
