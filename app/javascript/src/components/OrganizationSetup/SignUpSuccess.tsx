import React from "react";

import { GreenCheckCircleIcon } from "miruIcons";

import MiruLogoWatermark from "common/MiruLogoWatermark";
import { Paths } from "constants/index";

const SignUpSuccess = () => {
  const redirectToTimeTrackingPage = () => {
    window.location.href = Paths.TIME_TRACKING;
  };

  return (
    <div className="relative min-h-screen w-full px-8 pt-10 pb-4 md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-5/12 lg:w-352">
        <div>
          <img
            className="d-block mx-auto mb-4 h-10 w-10 font-bold text-miru-chart-green-400 md:mb-10 md:h-16 md:w-16 lg:mb-11"
            src={GreenCheckCircleIcon}
          />
        </div>
        <h1 className="text-center font-manrope text-2xl font-extrabold text-miru-chart-green-400 md:text-3xl lg:text-4.5xl">
          Thanks for
          <br />
          signing up
        </h1>
        <div className="pt-10">
          <p className="text-center font-manrope text-sm text-miru-dark-purple-1000 ">
            Your account has been setup and ready to use!
          </p>
        </div>
        <div className="pt-6 text-center font-manrope text-xs font-normal not-italic">
          <button
            className="form__button cursor-pointer whitespace-nowrap"
            type="submit"
            onClick={redirectToTimeTrackingPage}
          >
            Continue
          </button>
        </div>
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default SignUpSuccess;
