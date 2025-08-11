 
import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import React, { useState, useEffect } from "react";

import paymentSettings from "apis/payment-settings";
import PaymentsProviders from "apis/payments/providers";
import CustomCheckbox from "common/CustomCheckbox";
import CustomToggle from "common/CustomToggle";
import {
  XIcon,
  AmexSVG,
  ApplePaySVG,
  MasterCardSVG,
  PaypalLogoSVG,
  SConnectInvoiceSVG,
  StripeLogoSVG,
  VisaSVG,
} from "miruIcons";

interface IProvider {
  id: number;
  name: string;
  connected: boolean;
  enabled: boolean;
  acceptedPaymentMethods: Array<string>;
}

const InvoiceSettings = ({
  isStripeEnabled,
  setIsStripeEnabled,
  setShowInvoiceSetting,
}) => {
  const [status, setStatus] = useState<PaymentSettingsStatus>(
    PaymentSettingsStatus.IDLE
  );
  const [isChecked, setIsChecked] = useState<boolean>(true);
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(null);
  const [isPaypalConnected, setPaypalConnected] = useState<boolean>(false); //eslint-disable-line
  const [accountLink, setAccountLink] = useState<string>(null);
  const [stripeAcceptedPaymentMethods, setStripeAcceptedPaymentMethods] =
    useState<Array<string>>(null);
  const [stripe, setStripeSettings] = useState<IProvider>(null);  

  const connectStripe = async () => {
    const res = await paymentSettings.connectStripe();
    setAccountLink(res.data.accountLink);
  };

  const fetchPaymentsProvidersSettings = async () => {
    try {
      setStatus(PaymentSettingsStatus.LOADING);
      const res = await PaymentsProviders.get();
      const paymentsProviders = res.data.paymentsProviders;
      const stripe = paymentsProviders.find(p => p.name === "stripe");
      setIsStripeConnected(!!stripe && stripe.connected);
      setStripeAcceptedPaymentMethods(
        !!stripe && stripe.acceptedPaymentMethods
      );
      if (stripe) {
        setStripeSettings(stripe);
      }
      setStatus(PaymentSettingsStatus.SUCCESS);
    } catch {
      setStatus(PaymentSettingsStatus.ERROR);
    }
  };

  const updatePaymentsProvidersSettings = async (id, provider) => {
    await PaymentsProviders.update(id, provider);
  };

  const toggleStripe = async () => {
    setIsStripeEnabled(!isStripeEnabled);
  };

  const removePaymentMethod = async method => {
    await updatePaymentsProvidersSettings(stripe.id, {
      accepted_payment_methods: stripeAcceptedPaymentMethods.filter(
        m => m !== method
      ),
    });

    setStripeAcceptedPaymentMethods(
      stripeAcceptedPaymentMethods.filter(m => m !== method)
    );
  };

  const addPaymentMethod = async method => {
    await updatePaymentsProvidersSettings(stripe.id, {
      accepted_payment_methods: stripeAcceptedPaymentMethods.concat(method),
    });

    setStripeAcceptedPaymentMethods(
      stripeAcceptedPaymentMethods.concat(method)
    );
  };

  useEffect(() => {
    if (accountLink) {
      window.location.href = accountLink;
    }
  }, [accountLink]);

  useEffect(() => {
    fetchPaymentsProvidersSettings();
  }, [isStripeConnected]);

  return (
    status === PaymentSettingsStatus.SUCCESS && (
      <div className="sidebar__container flex flex-col justify-between p-6">
        <div>
          <span className="mb-3 flex justify-between text-base font-extrabold leading-5 text-miru-dark-purple-1000">
            Invoice Settings
            <button onClick={() => setShowInvoiceSetting(false)}>
              <XIcon color="#CDD6DF" size={15} />
            </button>
          </span>
          <span className="my-3 text-sm font-normal leading-5 text-miru-dark-purple-1000">
            Accept Online Payments
          </span>
          {(!!stripe && stripe.connected) || isPaypalConnected ? (
            <div className="mt-4 items-center bg-miru-gray-100 p-4">
              <div className="border-b-2 border-miru-gray-200">
                {stripe.connected && (
                  <div className="flex items-center justify-between">
                    <img
                      className="mr-38 pb-4"
                      src={StripeLogoSVG}
                      width="64px"
                    />
                    <CustomToggle
                      id={stripe.id}
                      isChecked={isStripeEnabled}
                      setIsChecked={setIsStripeEnabled}
                      toggleCss="mt-5"
                      onToggle={toggleStripe}
                    />
                  </div>
                )}
                {isPaypalConnected && (
                  <div className="flex items-center justify-between">
                    <img
                      className="mr-38 pb-4"
                      src={PaypalLogoSVG}
                      width="64px"
                    />
                    <CustomToggle
                      id="2"
                      isChecked={isChecked}
                      setIsChecked={setIsChecked}
                      toggleCss="mt-5"
                    />
                  </div>
                )}
              </div>
              {isStripeEnabled && (
                <>
                  <div className="mt-7 flex text-xs font-normal leading-4 text-miru-dark-purple-1000">
                    <CustomCheckbox
                      id={stripe.id}
                      isChecked={stripeAcceptedPaymentMethods.includes("card")}
                      name="stripePaymentMethods"
                      wrapperClassName="flex items-center"
                      checkboxValue={stripeAcceptedPaymentMethods.find(
                        m => m === "card"
                      )}
                      handleCheck={() => {
                        if (stripeAcceptedPaymentMethods.includes("card")) {
                          removePaymentMethod("card");
                        } else {
                          addPaymentMethod("card");
                        }
                      }}
                    />
                    <h4 className="pl-2">Accept Credit Cards</h4>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <img src={VisaSVG} />
                    <img src={MasterCardSVG} />
                    <img src={AmexSVG} />
                    <img src={ApplePaySVG} />
                  </div>
                </>
              )}
            </div>
          ) : null}
          {!isStripeConnected && (
            <div className="mt-3 mb-2 bg-miru-gray-100  p-4">
              <img
                className="mb-4"
                height="32px"
                src={StripeLogoSVG}
                width="64px"
              />
              <span className="text-sm font-normal leading-5 text-miru-dark-purple-1000">
                Connect with your existing stripe account or create a new
                account
              </span>
              <img
                className="mt-4 cursor-pointer"
                src={SConnectInvoiceSVG}
                onClick={connectStripe}
              />
            </div>
          )}
          {/* {!isPaypalConnected && (
          <div className="p-4 mt-2  bg-miru-gray-100">
            <img src={paypal} width="64px" height="32px" className="mb-4" />
            <span className="font-normal text-sm text-miru-dark-purple-1000 leading-5">
              Connect with your existing paypal account or create a new account
            </span>
            <img
              src={ConnectPaypalSVG}
              className="mt-4 cursor-pointer"
              onClick={() => setPaypalConnected(true)}
            />
          </div>
        )} */}
        </div>
      </div>
    )
  );
};

export default InvoiceSettings;
