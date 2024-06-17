import React from "react";

import { ConnectSVG, StripeLogoSVG, disconnectAccountSVG } from "miruIcons";

import Loader from "common/Loader/index";
import { ApiStatus as PaymentSettingsStatus } from "constants/index";

import EditHeader from "../../Common/EditHeader";

const StaticPage = ({
  isStripeConnected,
  setShowDisconnectDialog,
  connectStripe,
  status,
}) => (
  <>
    <EditHeader
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
                  <div className="ml-12 flex flex-row">
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
  </>
);

export default StaticPage;
