import React from "react";

import MiruLogoWatermark from "common/MiruLogoWatermark";

import SignInForm from "./SignInForm";
import FeaturePreviews from "../FeaturePreviews";

const SignIn = () => (
  <div className="relative flex min-h-screen">
    <SignInForm />
    <FeaturePreviews />
    <MiruLogoWatermark />
  </div>
);

export default SignIn;
