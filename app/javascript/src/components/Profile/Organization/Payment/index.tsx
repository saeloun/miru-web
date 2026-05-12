import React, { useEffect } from "react";
import { sendGAPageView } from "utils/googleAnalytics";

import OrganizationPaymentSettingsPage from "./Page";

const PaymentSettings = () => {
  useEffect(() => sendGAPageView(), []);

  return <OrganizationPaymentSettingsPage />;
};

export default PaymentSettings;
