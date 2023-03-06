import React, { useEffect, useCallback } from "react";

import { MiruLogoSVG } from "miruIcons";

import authenticationApi from "apis/authentication";

const EmailVerification = () => {
  const emailId = new URLSearchParams(window.location.search).get("email");

  const handleKeyPress = useCallback(event => {
    if (event.key === "Escape") {
      window.location.assign(`${window.location.origin}`);
    }
  }, []);

  const handleEmailConfirmation = async () => {
    await authenticationApi.sendEmailConfirmation({
      email: emailId,
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="modal__modal flex-col justify-start bg-miru-dark-purple-1000 pt-32">
      <img height="64px" src={MiruLogoSVG} width="64px" />
      <div className="modal__container modal-container mt-10">
        <div className="modal__content text-center">
          <h6 className="modal__title ">Email Verification</h6>
          <div className="modal__form flex-col">
            <p className="font-sm mt-6 mb-2 text-center font-normal leading-4 text-miru-dark-purple-1000">
              Please verify your email ID to continue.
            </p>
            <p className="font-sm my-2 text-center font-normal leading-4 text-miru-dark-purple-1000">
              Verification link has been sent to your email ID:
            </p>
            <h3 className="font-sm text-center font-bold leading-4 text-miru-dark-purple-1000">
              {emailId}
            </h3>
            <h3 className="font-xs mt-4 text-center font-normal leading-4 text-miru-dark-purple-1000">
              Didn’t recieve verification link?{" "}
              <button
                className="cursor-pointer font-bold text-miru-han-purple-1000 underline"
                onClick={handleEmailConfirmation}
              >
                Resend
              </button>
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
