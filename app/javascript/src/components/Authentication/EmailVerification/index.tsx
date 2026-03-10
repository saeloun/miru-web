import { MIRU_APP_URL } from "constants/index";

import React from "react";

import { authenticationApi } from "apis/api";
import MiruLogoWatermark from "common/MiruLogoWatermark";
import { MiruLogoWithTextSVG } from "miruIcons";

const EmailVerification = () => {
  const email = new URLSearchParams(window.location.search).get("email");

  const resendEmailVerificationLink = async email => {
    await authenticationApi.sendEmailConfirmation({ email });
  };

  return (
    <div className="relative min-h-screen w-full bg-background px-8 pb-4 pt-10 text-foreground md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-5/12 lg:w-352">
        <div>
          <a href={MIRU_APP_URL} rel="noreferrer noopener">
            <img
              alt="Miru"
              className="d-block mx-auto mb-4 h-10 w-auto object-contain brightness-0 dark:invert md:mb-10 lg:mb-20"
              src={MiruLogoWithTextSVG}
            />
          </a>
        </div>
        <h1 className="text-center font-geist text-2xl font-extrabold text-foreground md:text-3xl lg:text-4.5xl">
          Email Verification
        </h1>
        <div className="pt-10">
          <p className="text-center font-geist text-sm text-foreground ">
            Verification link has been sent to your email ID:
            <span className="pl-1 font-geist font-bold">{email}</span>
          </p>
        </div>
        <p className="pt-6 text-center font-geist text-xs font-normal not-italic">
          Didn’t receive verification link?
          <button
            className="cursor-pointer pl-1 font-semibold text-foreground no-underline hover:text-primary"
            onClick={() => resendEmailVerificationLink(email)}
          >
            Resend
          </button>
        </p>
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default EmailVerification;
