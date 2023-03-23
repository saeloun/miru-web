import React from "react";

import { MiruLogoSVG } from "miruIcons";

import authenticationApi from "apis/authentication";
import MiruLogoWatermark from "common/MiruLogoWatermark";
import { MIRU_APP_URL } from "constants/index";

interface Props {
  email: string;
}
const PasswordResetLinkSentMsg = ({ email }: Props) => {
  const resendPasswordResetLink = async (email: string) => {
    if (email?.trim()) {
      await authenticationApi.forgotPassword({ email });
    }
  };

  return (
    <div className="relative min-h-screen w-full px-8 pt-10 pb-4 md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-5/12 lg:w-352">
        <div>
          <a href={MIRU_APP_URL} rel="noreferrer noopener">
            <img
              alt="miru-logo"
              className="d-block mx-auto mb-10 md:mb-20"
              height="64"
              src={MiruLogoSVG}
              width="64"
            />
          </a>
        </div>
        <h1 className="text-center font-manrope text-4.5xl font-extrabold text-miru-han-purple-1000">
          Password reset link sent
        </h1>
        <div className="pt-10">
          <p className="text-center font-manrope text-sm text-miru-dark-purple-1000 ">
            A password reset link has been sent to your email ID:
            <span className="pl-1 font-manrope font-bold">{email}</span>
          </p>
        </div>
        <p className="pt-6 text-center font-manrope text-xs font-normal not-italic">
          Didn’t recieve reset link?
          <span
            className="pl-1 font-semibold text-miru-han-purple-1000"
            onClick={() => resendPasswordResetLink(email)}
          >
            Resend
          </span>
        </p>
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default PasswordResetLinkSentMsg;
