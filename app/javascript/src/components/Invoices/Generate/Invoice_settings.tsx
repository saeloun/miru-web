/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import paymentSettings from "apis/payment-settings";
import CustomCheckbox from "common/CustomCheckbox";
import CustomToggle from "common/CustomToggle";
import { X } from "phosphor-react";
import { ApiStatus as PaymentSettingsStatus } from "../../../constants";

const amex = require("../../../../../assets/images/amex.svg");
const applePay = require("../../../../../assets/images/applePay.svg");
const masterCard = require("../../../../../assets/images/masterCard.svg");
const paypal = require("../../../../../assets/images/PaypalLogo.svg");
const paypalConnect = require("../../../../../assets/images/pConnectInvoice.svg");
const stripeConnect = require("../../../../../assets/images/sConnectInvoice.svg");
const stripe = require("../../../../../assets/images/stripe_logo.svg");
const visa = require("../../../../../assets/images/visa.svg");

const Invoice_settings = ({ setShowInvoiceSetting }) => {
  const [status, setStatus] = React.useState<PaymentSettingsStatus>(
    PaymentSettingsStatus.IDLE
  );
  const [isChecked, setIsChecked] = useState<boolean>(true);
  const [isStripeConnected, setStripeConnected] = useState<boolean>(null);
  const [isPaypalConnected, setPaypalConnected] = useState<boolean>(false);
  const [accountLink, setAccountLink] = useState<string>(null);
  const [acceptCardPaymentsStripe, setAcceptCardPaymentsStripe] = useState<boolean>(false);

  const connectStripe = async () => {
    const res = await paymentSettings.connectStripe();
    setAccountLink(res.data.accountLink);
  };

  const fetchPaymentSettings = async () => {
    try {
      setStatus(PaymentSettingsStatus.LOADING);
      const res = await paymentSettings.get();
      setStripeConnected(res.data.providers.stripe.connected);
      setAcceptCardPaymentsStripe(true);
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
    <div className="sidebar__container flex flex-col p-6 justify-between">
      <div>

        <span className="mb-3 flex justify-between font-extrabold text-base text-miru-dark-purple-1000 leading-5">
          Invoice Settings
          <button onClick={() => setShowInvoiceSetting(false)}>
            <X size={15} color="#CDD6DF" />
          </button>
        </span>
        <span className="my-3 font-normal text-sm leading-5 text-miru-dark-purple-1000">
          Accept Online Payments
        </span>

        {isStripeConnected || isPaypalConnected ? (
          <div className="p-4 mt-4 items-center bg-miru-gray-100">
            <div className="border-b-2 border-miru-gray-200">

              {isStripeConnected && (
                <div className="flex justify-between items-center">
                  <img src={stripe} width="64px" className="pb-4 mr-38" />
                  <CustomToggle
                    id='1'
                    isChecked={isChecked}
                    setIsChecked={setIsChecked}
                    toggleCss="mt-5"
                  />
                </div>
              )}

              {isPaypalConnected && (
                <div className="flex justify-between items-center">
                  <img src={paypal} width="64px" className="pb-4 mr-38" />
                  <CustomToggle
                    id='2'
                    isChecked={isChecked}
                    setIsChecked={setIsChecked}
                    toggleCss="mt-5"
                  />
                </div>
              )}
            </div>

            <div className="mt-7 font-normal text-xs text-miru-dark-purple-1000 leading-4 flex">
              <CustomCheckbox
                id={1}
                handleCheck={() => setAcceptCardPaymentsStripe(!acceptCardPaymentsStripe)} // eslint-disable-line
                isChecked={acceptCardPaymentsStripe}
                checkboxValue={null}
              />
              <h4 className="pl-2">Accept Credit Cards</h4>
            </div>
            <div className="mt-6 flex justify-between">
              <img src={visa} />
              <img src={masterCard} />
              <img src={amex} />
              <img src={applePay} />
            </div>
          </div>
        ) : null}

        {!isStripeConnected && (
          <div className="p-4 mt-3 mb-2  bg-miru-gray-100">
            <img src={stripe} width="64px" height="32px" className="mb-4" />
            <span className="font-normal text-sm text-miru-dark-purple-1000 leading-5">
              Connect with your existing stripe account or create a new account
            </span>
            <img
              src={stripeConnect}
              className="mt-4 cursor-pointer"
              onClick={connectStripe}
            />
          </div>
        )}

        {!isPaypalConnected && (
          <div className="p-4 mt-2  bg-miru-gray-100">
            <img src={paypal} width="64px" height="32px" className="mb-4" />
            <span className="font-normal text-sm text-miru-dark-purple-1000 leading-5">
              Connect with your existing paypal account or create a new account
            </span>
            <img
              src={paypalConnect}
              className="mt-4 cursor-pointer"
              onClick={() => setPaypalConnected(true)}
            />
          </div>
        )}
      </div>

      <button
        className={`p-2 mt-2 ${
          isStripeConnected || isPaypalConnected
            ? "bg-miru-han-purple-1000"
            : "bg-miru-gray-1000"
        } rounded font-bold text-base text-white leading-5 text-center tracking-wider`}
      >
        SAVE
      </button>
    </div>
  );
};

export default Invoice_settings;
