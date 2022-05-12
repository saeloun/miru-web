/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import paymentSettings from "apis/payment-settings";
import Header from "./Header";
import SideNav from "./SideNav";
import { ApiStatus as PaymentSettingsStatus } from "../../constants";
const Connect = require("../../../../assets/images/Connect.svg");
const connectedCheck = require("../../../../assets/images/connected_check.svg");
const Connect_Paypal = require("../../../../assets/images/ConnectPaypal.svg");
const Paypal_Logo = require("../../../../assets/images/PaypalLogo.svg");
const Stripe_Logo = require("../../../../assets/images/stripe_logo.svg");

const payment_settings = () => {
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
    setAuthHeaders();
    registerIntercepts();
    fetchPaymentSettings();
  }, [isStripeConnected]);

  return status === PaymentSettingsStatus.SUCCESS && (
    <React.Fragment>
      <Header />
      <div className="flex mt-5 mb-10">
        <SideNav />
        <div className="flex flex-col">
          <div className="h-16 pl-20 py-4 bg-miru-han-purple-1000 flex text-white">
            <span className="font-bold text-2xl">Payment Settings </span>
            <span className="font-normal text-sm pt-2 ml-4">
            Connect payment gateways
            </span>
          </div>
          <div className="py-10 px-20 mt-4 bg-miru-gray-100 h-screen">
            <div className="h-36 p-5 bg-white flex flex-row items-center">
              <div className="pr-12 border-r-2 border-miru-gray-200 w-fit">
                <img src={Stripe_Logo} />
              </div>
              <span className="px-4 font-normal text-sm text-miru-dark-purple-1000 leading-5 w-2/5">
                { isStripeConnected ? "Your stripe account is now connected and ready to accept online payments" : "Connect with your existing stripe account or create a new account" }
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
    </React.Fragment>
  );};

export default payment_settings;
