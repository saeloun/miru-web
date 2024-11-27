import React from "react";

import { ConnectSVG, StripeLogoSVG, disconnectAccountSVG } from "miruIcons";
import { Button } from "StyledComponents";

import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import BankDetails from "./BankDetails";

const StaticPage = ({
  isStripeConnected,
  setShowDisconnectDialog,
  editBankDetails,
  setEditBankDetails,
  handleCancelAction,
  handleUpdateDetails,
  connectStripe,
  status,
  isLoading,
  bankName,
  accountNumber,
  accountType,
  routingNumber,
  setBankName,
  setAccountNumber,
  setAccountType,
  setRoutingNumber,
  errDetails,
}) => (
  <>
    <div className="flex h-16 items-center justify-between bg-miru-han-purple-1000 p-4 pl-10 text-white">
      <span className="text-2xl font-bold">Payment Settings</span>
      {editBankDetails ? (
        <div>
          <Button
            className="mr-2 sm:px-6 sm:py-1"
            style="whiteBorder"
            onClick={() => handleCancelAction()}
          >
            Cancel
          </Button>
          <Button
            className="bg-white font-bold sm:px-8 sm:py-1"
            style="secondary"
            onClick={() => handleUpdateDetails()}
          >
            Save
          </Button>
        </div>
      ) : (
        <Button
          className="sm:py-1"
          style="whiteBorder"
          onClick={() => setEditBankDetails(true)}
        >
          Edit Bank Details
        </Button>
      )}
    </div>
    {status === PaymentSettingsStatus.LOADING ? (
      <Loader />
    ) : (
      status === PaymentSettingsStatus.SUCCESS && (
        <div className="w-full">
          <div className="flex flex-col">
            <div className="mt-4 h-screen bg-miru-gray-100 py-10 px-20">
              <div className="flex h-36 flex-row items-center bg-white px-6 py-10">
                <div className="w-1/4 border-r-2 border-miru-gray-200">
                  <img src={StripeLogoSVG} />
                </div>
                <span className="w-1/2 px-4 text-sm font-normal leading-5 text-miru-dark-purple-1000">
                  {isStripeConnected
                    ? "Your stripe account is now connected and ready to accept online payments"
                    : "Connect with your existing stripe account or create a new account"}
                </span>
                {isStripeConnected ? (
                  <div className="flex">
                    <div className="logo-container mr-1 py-2">
                      <img src={disconnectAccountSVG} />
                    </div>
                    <button
                      className="ml-1 text-base font-extrabold text-miru-red-400"
                      onClick={() => setShowDisconnectDialog(true)}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button onClick={connectStripe}>
                    <img className="pr-5" src={ConnectSVG} />
                  </button>
                )}
              </div>
              <Divider CustomStyle="my-10" />
              {isLoading ? (
                <Loader />
              ) : (
                <BankDetails
                  accountNumber={accountNumber}
                  accountType={accountType}
                  bankName={bankName}
                  editBankDetails={editBankDetails}
                  errDetails={errDetails}
                  isLoading={isLoading}
                  routingNumber={routingNumber}
                  setAccountNumber={setAccountNumber}
                  setAccountType={setAccountType}
                  setBankName={setBankName}
                  setRoutingNumber={setRoutingNumber}
                />
              )}
              {/* OLD CODE: PAYPAL
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
									</div> */}
            </div>
          </div>
        </div>
      )
    )}
  </>
);

export default StaticPage;
