/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import paymentSettings from "apis/payment-settings";
import Loader from "common/Loader/index";
import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import Header from "../../Header";

const Connect = require("../../../../../../assets/images/Connect.svg");
const connectedCheck = require("../../../../../../assets/images/connected_check.svg");
const Connect_Paypal = require("../../../../../../assets/images/ConnectPaypal.svg");
const Paypal_Logo = require("../../../../../../assets/images/PaypalLogo.svg");
const Stripe_Logo = require("../../../../../../assets/images/stripe_logo.svg");

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
    } catch (err) {
      setStatus(PaymentSettingsStatus.ERROR);
    }
  };

  useEffect(() => {
    if (accountLink) {
      window.location.href = accountLink;
    }
  }, [accountLink]);

  useEffect(() => {
    fetchPaymentSettings();
  }, [isStripeConnected]);

  return (
    <React.Fragment>
      <div className="flex flex-col w-4/5">
        <Header
          title={"Payment Settings"}
          subTitle={"Connect payment gateways"}
          showButtons={false}
        />
        {(status === PaymentSettingsStatus.LOADING) ? <Loader /> : (status === PaymentSettingsStatus.SUCCESS) && (
          <div className="flex">
            <div className="flex flex-col">
              <div className="py-10 px-20 mt-4 bg-miru-gray-100 h-screen">
                <div className="h-36 p-5 bg-white flex flex-row items-center">
                  <div className="pr-12 border-r-2 border-miru-gray-200 w-fit">
                    <img src={Stripe_Logo} />
                  </div>
                  <span className="px-4 font-normal text-sm text-miru-dark-purple-1000 leading-5 w-2/5">
                    {isStripeConnected ? "Your stripe account is now connected and ready to accept online payments" : "Connect with your existing stripe account or create a new account"}
                  </span>
                  {
                    isStripeConnected ?
                      <div className="flex flex-row">
                        <div className="logo-container mr-1">
                          <img src={connectedCheck} />
                        </div>
                        <p className="ml-1 text-miru-alert-green-800 font-extrabold text-base">Connected</p>
                      </div> :
                      <button
                        onClick={connectStripe}
                      >
                        <img src={Connect} className="pr-5" />
                      </button>
                  }
                </div>
                <div className="h-36 p-5 mt-6 bg-white flex justify-between items-center">
                  <div className="pr-12 border-r-2 border-miru-gray-200 w-fit">
                    <img src={Paypal_Logo} />
                  </div>
                  <span className="px-4 font-normal text-sm text-miru-dark-purple-1000 leading-5 w-2/5">
                    Connect with your existing paypal account or create a new account
                  </span>
                  <button>
                    <img src={Connect_Paypal} className="pr-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default PaymentSettings;
