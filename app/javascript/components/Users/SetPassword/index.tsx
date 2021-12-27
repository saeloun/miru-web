import * as React from "react";

import authApi from "components/apis/auth";

import Container from "components/Container";
import SetPasswordForm from "./SetPasswordForm";

const SetPassword = () => {
  const [password, setPassword] = React.useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] =
    React.useState<string>("");

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const response = await authApi.set_password({
        password,
        password_confirmation: passwordConfirmation
      });
      window.location.href = "/";
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
          Set Password
        </h2>
        <SetPasswordForm
          setPassword={setPassword}
          setPasswordConfirmation={setPasswordConfirmation}
          handleSubmit={handleSubmit}
        />
      </div>
    </Container>
  );
};
export default SetPassword;
