import React, { useEffect, useCallback } from "react";

import { MiruLogoSVG } from "miruIcons";

import { useUserContext } from "context/UserContext";
import authenticationApi from "apis/authentication";
import Logger from "js-logger";


const EmailVerification = () => {
  const { user } = useUserContext();
  // @ts-ignore
  const { email } = user

  useEffect(() => {
    handleEmailConfirmation()
  }, [])

  const handleKeyPress = useCallback(event => {
    if (event.key === "Escape") {
      window.location.assign(`${window.location.origin}`);
    }
  }, []);

  const handleEmailConfirmation = async() => {
    try {
      // @ts-ignore
      await authenticationApi.sendEmailConfirmation(`&email=${email}`)
    } catch (err) {
      Logger.error(err)
    }
  }

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
            <h3 className="font-sm my-6 text-center font-normal leading-4 text-miru-dark-purple-1000">
              Please verify your email ID to continue. <br/>
              Verification link has been sent to your email ID:
              <br />
              <h3 className="font-sm text-center font-bold leading-4 text-miru-dark-purple-1000">
                {email}
              </h3>
            </h3>
            <h3 className="font-xs text-center font-normal leading-4 text-miru-dark-purple-1000">
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
