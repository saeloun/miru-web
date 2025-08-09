import React from "react";

import MiruLogoWatermark from "common/MiruLogoWatermark";
import { useNavigate } from "react-router-dom";

const InvalidLink = () => {
  const navigate = useNavigate();

  const redirectToLoginPage = () => {
    navigate("/");
  };

  return (
    <div className=" relative flex min-h-screen w-full flex-col items-center justify-center px-8 md:px-0 ">
      <div className="mx-auto min-h-full md:w-5/12 lg:w-352">
        <h1 className="text-center font-manrope text-xl font-extrabold text-miru-dark-purple-1000 md:text-3xl lg:text-3.5xl">
          The link is not valid
          <br />
        </h1>
        <div className="pt-10">
          <p className="text-center font-manrope text-2xl text-miru-dark-purple-1000 ">
            Please check with the Administrator
          </p>
        </div>
        <div className="pt-6 text-center font-manrope text-xs font-normal not-italic">
          <button
            className="form__button cursor-pointer whitespace-nowrap"
            type="submit"
            onClick={redirectToLoginPage}
          >
            Login
          </button>
        </div>
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default InvalidLink;
