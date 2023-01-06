/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import { ConnectSVG, ConnectedCheckSVG, StripeLogoSVG } from "miruIcons";

import paymentSettings from "apis/payment-settings";
import Loader from "common/Loader/index";
import { ApiStatus as PaymentSettingsStatus } from "constants/index";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "../../Header";

const PaymentSettings = () => {
  const [status, setStatus] = React.useState<PaymentSettingsStatus>(
    PaymentSettingsStatus.IDLE
  );
  const [accountLink, setAccountLink] = useState<string>(null);
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(null);
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

  return (
    <div className="flex w-4/5 flex-col">
      <Header
        showButtons={false}
        subTitle="Connect payment gateways"
        title="Payment Settings"
      />
      {status === PaymentSettingsStatus.LOADING ? (
        <Loader />
      ) : (
        status === PaymentSettingsStatus.SUCCESS && (
          <div className="flex">
            <div className="flex flex-col">
              <div className="mt-4 h-screen bg-miru-gray-100 py-10 px-20">
                <div className="flex h-36 flex-row items-center bg-white p-5">
                  <div className="w-fit border-r-2 border-miru-gray-200 pr-12">
                    <img src={StripeLogoSVG} />
                  </div>
                  <span className="w-2/5 px-4 text-sm font-normal leading-5 text-miru-dark-purple-1000">
                    {isStripeConnected
                      ? "Your stripe account is now connected and ready to accept online payments"
                      : "Connect with your existing stripe account or create a new account"}
                  </span>
                  {isStripeConnected ? (
                    <div className="flex flex-row">
                      <div className="logo-container mr-1">
                        <img src={ConnectedCheckSVG} />
                      </div>
                      <p className="ml-1 text-base font-extrabold text-miru-alert-green-800">
                        Connected
                      </p>
                    </div>
                  ) : (
                    <button onClick={connectStripe}>
                      <img className="pr-5" src={ConnectSVG} />
                    </button>
                  )}
                </div>
                {/* <div className="h-36 p-5 mt-6 bg-white flex justify-between items-center">
                  <div className="pr-12 border-r-2 border-miru-gray-200 w-fit">
                    <img src={Paypal_Logo} />
                  </div>
                  <span className="px-4 font-normal text-sm text-miru-dark-purple-1000 leading-5 w-2/5">
                    Connect with your existing paypal account or create a new account
                  </span>
                  <button>
                    <img src={Connect_Paypal} className="pr-5" />
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PaymentSettings;
