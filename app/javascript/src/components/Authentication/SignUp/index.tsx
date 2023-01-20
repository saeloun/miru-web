import React, { useEffect } from "react";

import { registerIntercepts, setAuthHeaders } from "apis/axios";

import SignUpForm from "./SignUpForm";

import FeaturePreviews from "../FeaturePreviews";

const SignUp = () => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <div className="relative flex min-h-screen">
      <SignUpForm />
      <FeaturePreviews />
    </div>
  );
};

export default SignUp;
