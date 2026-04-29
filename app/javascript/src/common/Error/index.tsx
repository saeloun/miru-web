import React from "react";

import { i18n } from "../../i18n";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { MiruLogoWithTextSVG, MiruLogoWatermarkSVG } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { dashboardUrl } from "utils/dashboardUrl";

const ErrorPage = () => {
  const navigate = useNavigate();
  const { isDesktop, companyRole } = useUserContext();

  const ErrorPageLayout = () => (
    <div className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center bg-background px-4 py-8 lg:min-h-full lg:px-8">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-border bg-card px-6 py-10 shadow-sm lg:px-10 lg:py-14">
        <img
          className="pointer-events-none absolute right-[-5rem] bottom-[-6rem] hidden w-64 opacity-10 lg:block"
          src={MiruLogoWatermarkSVG}
        />
        <div className="relative flex flex-col items-center text-center">
          <div className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Error 404
          </div>
          <img className="mt-8 h-auto w-40 lg:w-48" src={MiruLogoWithTextSVG} />
          <div className="mt-8 text-6xl font-semibold tracking-[-0.04em] text-foreground lg:text-7xl">
            404
          </div>
          <span className="mt-4 text-center text-xl font-semibold leading-8 text-foreground">
            {i18n.t("pageNotFound")}
          </span>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground lg:text-base">
            {i18n.t("common.pageUnavailable")}
          </p>
          <button
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 lg:w-auto lg:min-w-56"
            onClick={() => {
              navigate(dashboardUrl(companyRole));
            }}
            type="button"
          >
            {i18n.t("common.goToDashboard")}
          </button>
        </div>
      </div>
    </div>
  );

  const Main = withLayout(ErrorPageLayout, !isDesktop, !isDesktop);

  return isDesktop ? ErrorPageLayout() : <Main />;
};

export default ErrorPage;
