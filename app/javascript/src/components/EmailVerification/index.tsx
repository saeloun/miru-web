import React, { useEffect, useCallback } from "react";

const miruLogo = require("../../../../assets/images/miru-logo.svg"); //eslint-disable-line

const EmailVerification = ({ userEmail, resendUrl }) => {
  const handleKeyPress = useCallback((event) => {
    if (event.key === "Escape") {
      location.assign(window.location.origin + "/users/sign_in");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="modal__modal bg-miru-dark-purple-1000 flex-col justify-start pt-32">
      <img src={miruLogo} width="64px" height="64px" />
      <div className="modal__container modal-container mt-10">
        <div className="modal__content text-center">
          <h6 className="modal__title ">Email Verification</h6>
          <div className="modal__form flex-col">
            <h3 className="my-6 font-sm font-normal text-center leading-4 text-miru-dark-purple-1000">
              Verification link has been sent to your email ID:
              <br />
              <h3 className="font-sm font-bold text-center leading-4 text-miru-dark-purple-1000">
                {userEmail}
              </h3>
            </h3>

            <h3 className="font-xs font-normal text-center leading-4 text-miru-dark-purple-1000">
              Didn’t recieve verification link?{" "}
              <a
                href={resendUrl}
                className="font-bold text-miru-han-purple-1000 underline cursor-pointer"
              >
                Resend
              </a>
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
