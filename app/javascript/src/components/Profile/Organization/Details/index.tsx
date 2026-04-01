import React, { useEffect } from "react";
import { useUserContext } from "context/UserContext";
import { useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import OrganizationSettingsPage from "./Page";

const OrgDetails = () => {
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  useEffect(() => {
    sendGAPageView();
  }, []);

  const handleBackBtnClick = () => {
    navigate(isDesktop ? `/settings/organization` : "/settings", {
      replace: true,
    });
  };

  return <OrganizationSettingsPage onBack={handleBackBtnClick} />;
};

export default OrgDetails;
