import React, { useEffect } from "react";

import { registerIntercepts, setAuthHeaders } from "apis/axios";
import FeaturePreviews from "components/SignUp/FeaturePreviews";

import SignInForm from "./SignInForm";

const SignIn = () => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <div className="flex min-h-screen">
      <SignInForm />
      <FeaturePreviews />
    </div>
  );
};

export default SignIn;
