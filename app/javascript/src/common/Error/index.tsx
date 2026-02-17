import React from "react";

import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { Animation_404 } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";
import { dashboardUrl } from "utils/dashboardUrl";

const ErrorPage = () => {
  const navigate = useNavigate();
  const { isDesktop, companyRole } = useUserContext();

  const ErrorPageLayout = () => (
    <div className="flex h-90v w-full items-center justify-center lg:h-full">
      <div className="flex h-full w-full flex-col items-center justify-center bg-white px-4 lg:h-5/6">
        <img className="h-auto w-5/6 lg:w-1/4" src={Animation_404} />
        <span className="py-15/100 text-center text-base font-semibold leading-5 text-miru-dark-purple-200 lg:pt-5/100 lg:pb-2/100 lg:text-lg lg:leading-7">
          Page not Found
        </span>
        <Button
          className="w-full py-2 lg:w-1/4 lg:py-4"
          onClick={() => {
            navigate(dashboardUrl(companyRole));
          }}
        >
          Click here
        </Button>
      </div>
    </div>
  );

  const Main = withLayout(ErrorPageLayout, !isDesktop, !isDesktop);

  return isDesktop ? ErrorPageLayout() : <Main />;
};
export default ErrorPage;
