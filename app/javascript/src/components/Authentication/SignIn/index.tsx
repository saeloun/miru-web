import React from "react";

import SignInForm from "./SignInForm";

import FeaturePreviews from "../FeaturePreviews";

const SignIn = () => (
  <div className="relative flex min-h-screen">
    <SignInForm />
    <FeaturePreviews />
  </div>
);

export default SignIn;
