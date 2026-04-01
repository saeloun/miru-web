import React from "react";

import MiruLogoWatermark from "common/MiruLogoWatermark";
import { i18n } from "../../../i18n";
import { useNavigate } from "react-router-dom";

const InvalidLink = () => {
  const navigate = useNavigate();

  const redirectToLoginPage = () => {
    navigate("/");
  };

  return (
    <div className=" relative flex min-h-screen w-full flex-col items-center justify-center px-8 md:px-0 ">
      <div className="mx-auto min-h-full md:w-5/12 lg:w-352">
        <h1 className="text-center font-sans text-xl font-bold text-foreground md:text-3xl lg:text-3.5xl">
          {i18n.t("team.invalidLink")}
          <br />
        </h1>
        <div className="pt-10">
          <p className="text-center font-sans text-2xl text-foreground ">
            {i18n.t("team.checkWithAdmin")}
          </p>
        </div>
        <div className="pt-6 text-center font-sans text-xs font-normal not-italic">
          <button
            className="form__button cursor-pointer whitespace-nowrap"
            type="submit"
            onClick={redirectToLoginPage}
          >
            {i18n.t("team.login")}
          </button>
        </div>
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default InvalidLink;
