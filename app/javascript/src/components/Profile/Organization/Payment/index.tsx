import React, { useEffect } from "react";
import { useUserContext } from "context/UserContext";
import { useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import OrganizationPaymentSettingsPage from "./Page";

const PaymentSettings = () => {
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

  useEffect(() => sendGAPageView(), []);

  const handleBackBtnClick = () => {
    navigate(isDesktop ? "/settings/profile" : "/settings", { replace: true });
  };

  return <OrganizationPaymentSettingsPage onBack={handleBackBtnClick} />;
};

export default PaymentSettings;
