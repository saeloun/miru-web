import React, { useEffect } from "react";

import { registerIntercepts, setAuthHeaders } from "apis/axios";

import SignInForm from "./SignInForm";

import FeaturePreviews from "../FeaturePreviews";

const SignIn = () => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <div className="flex">
      <SignInForm />
      <FeaturePreviews />
    </div>
  );
};

export default SignIn;
