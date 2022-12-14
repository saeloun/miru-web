import React from "react";

import FeaturePreviews from "./FeaturePreviews";
import SignUpForm from "./SignUpForm";

const SignUp = () => (
  <div className="flex min-h-screen">
    <SignUpForm />
    <FeaturePreviews />
  </div>
);

export default SignUp;
