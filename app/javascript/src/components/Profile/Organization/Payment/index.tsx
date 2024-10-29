/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import paymentSettings from "apis/payment-settings";
import { ApiStatus as PaymentSettingsStatus } from "constants/index";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import BankSchema from "./BankDetails/BankSchema";
import MobileView from "./MobileView";
import StaticPage from "./StaticPage";

import DisconnectPayment from "../Popups/DisconnectPayment";

const PaymentSettings = () => {
  const [status, setStatus] = React.useState<PaymentSettingsStatus>(
    PaymentSettingsStatus.IDLE
  );
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();
  const [accountLink, setAccountLink] = useState<string>(null);
  const [isStripeConnected, setIsStripeConnected] = useState<boolean>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] =
    useState<boolean>(false);
  const [editBankDetails, setEditBankDetails] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [routingNumber, setRoutingNumber] = useState<string>("");
  const [errDetails, setErrDetails] = useState<object>({});

  const connectStripe = async () => {
    const res = await paymentSettings.connectStripe();
    setAccountLink(res.data.accountLink);
  };

  const handleCancelAction = () => {
    setEditBankDetails(false);
  };

  const handleUpdateDetails = async () => {
    const bankAccount = {
      routingNumber,
      accountNumber,
      accountType,
      bankName,
    };

    try {
      await BankSchema.validate(bankAccount, { abortEarly: false });
      setIsLoading(true);
      const payload = {
        bank_account: {
          routing_number: routingNumber,
          account_number: accountNumber,
          account_type: accountType,
          bank_name: bankName,
        },
      };
      const res = await paymentSettings.updateBankDetails(payload);
      if (res.status == 200) {
        setBankName("");
        setAccountNumber("");
        setAccountType("");
        setRoutingNumber("");
        setEditBankDetails(false);
        fetchPaymentSettings();
        setIsLoading(false);
      }
    } catch (err) {
      const errObj = {
        bankNameErr: "",
        routingNumberErr: "",
        accountNumberErr: "",
        accountTypeErr: "",
      };

      err.inner.map(item => {
        errObj[`${item.path.split(".").pop()}Err`] = item.message;
      });
      setErrDetails(errObj);
    }
  };

  const fetchPaymentSettings = async () => {
    setStatus(PaymentSettingsStatus.LOADING);
    const res = await paymentSettings.get();
    if (res.status == 200) {
      const bankDetails = res.data.providers.bankAccount;
      if (bankDetails) {
        setBankName(bankDetails.bankName);
        setAccountNumber(bankDetails.accountNumber);
        setAccountType(bankDetails.accountType);
        setRoutingNumber(bankDetails.routingNumber);
      }
      setIsStripeConnected(res.data.providers.stripe.connected);
      setStatus(PaymentSettingsStatus.SUCCESS);
    } else {
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

  return (
    <div className="flex h-full w-full flex-col">
      {isDesktop ? (
        <StaticPage
          accountNumber={accountNumber}
          accountType={accountType}
          bankName={bankName}
          connectStripe={connectStripe}
          editBankDetails={editBankDetails}
          errDetails={errDetails}
          handleCancelAction={handleCancelAction}
          handleUpdateDetails={handleUpdateDetails}
          isLoading={isLoading}
          isStripeConnected={isStripeConnected}
          routingNumber={routingNumber}
          setAccountNumber={setAccountNumber}
          setAccountType={setAccountType}
          setBankName={setBankName}
          setEditBankDetails={setEditBankDetails}
          setRoutingNumber={setRoutingNumber}
          setShowDisconnectDialog={setShowDisconnectDialog}
          status={status}
        />
      ) : (
        <MobileView
          accountNumber={accountNumber}
          accountType={accountType}
          bankName={bankName}
          connectStripe={connectStripe}
          editBankDetails={editBankDetails}
          errDetails={errDetails}
          handleCancelAction={handleCancelAction}
          handleUpdateDetails={handleUpdateDetails}
          isLoading={isLoading}
          isStripeConnected={isStripeConnected}
          routingNumber={routingNumber}
          setAccountNumber={setAccountNumber}
          setAccountType={setAccountType}
          setBankName={setBankName}
          setEditBankDetails={setEditBankDetails}
          setRoutingNumber={setRoutingNumber}
          setShowDisconnectDialog={setShowDisconnectDialog}
          status={status}
          title="Payment Settings"
          onBackArrowClick={handleBackBtnClick}
        />
      )}
      {showDisconnectDialog && (
        <DisconnectPayment
          fetchPaymentSettings={fetchPaymentSettings}
          setShowDisconnectDialog={setShowDisconnectDialog}
          showDisconnectDialog={showDisconnectDialog}
        />
      )}
    </div>
  );
};

export default PaymentSettings;
