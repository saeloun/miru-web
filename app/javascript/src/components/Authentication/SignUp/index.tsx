import React from "react";

import MiruLogoWatermark from "common/MiruLogoWatermark";

import SignUpForm from "./SignUpForm";

import FeaturePreviews from "../FeaturePreviews";

const SignUp = () => (
  <div className="relative flex min-h-screen">
    <SignUpForm />
    <FeaturePreviews />
    <MiruLogoWatermark />
  </div>
);

export default SignUp;
