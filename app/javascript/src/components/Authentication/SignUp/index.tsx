import React from "react";

import SignUpForm from "./SignUpForm";

import FeaturePreviews from "../FeaturePreviews";

const SignUp = () => (
  <div className="relative flex min-h-screen">
    <SignUpForm />
    <FeaturePreviews />
  </div>
);

export default SignUp;
