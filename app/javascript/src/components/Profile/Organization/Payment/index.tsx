import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import React, { useState, useEffect } from "react";

import { paymentSettings } from "apis/api";
import { useUserContext } from "context/UserContext";
import { useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import ModernPaymentSettings from "./ModernPaymentSettings";

const PaymentSettings = () => {
  const [status, setStatus] = React.useState<PaymentSettingsStatus>(
    PaymentSettingsStatus.IDLE
  );
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();
  const [accountLink, setAccountLink] = useState<string>("");
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] =
    useState<boolean>(false);

  const connectStripe = async () => {
    const res = await paymentSettings.connectStripe();
    setAccountLink(res.data.accountLink);
  };

  const fetchPaymentSettings = async () => {
    try {
      setStatus(PaymentSettingsStatus.LOADING);
      const res = await paymentSettings.get();
      setIsStripeConnected(res.data.providers.stripe.connected);
      setStatus(PaymentSettingsStatus.SUCCESS);
    } catch {
      setStatus(PaymentSettingsStatus.ERROR);
    }
  };

  useEffect(() => sendGAPageView(), []);

  useEffect(() => {
    if (accountLink) {
      window.location.href = accountLink;
    }
  }, [accountLink]);

  useEffect(() => {
    fetchPaymentSettings();
  }, [isStripeConnected]);

  const handleBackBtnClick = () => {
    navigate(isDesktop ? "/settings/profile" : "/settings", { replace: true });
  };

  return <ModernPaymentSettings onBack={handleBackBtnClick} />;
};

export default PaymentSettings;
