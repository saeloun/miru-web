import React, { useState } from "react";

import Logger from "js-logger";
import { ConnectSVG, GoogleIcon } from "miruIcons";

const Calendar = () => {
  // eslint-disable-next-line no-unused-vars
  const [connectGoogleCalendar, setConnectGoogleCalendar] =
    useState<boolean>(false);

  const connectCalendar = () => {
    Logger.log("Clicked");
  };

  return (
    <div className="flex">
      <div className="flex flex-col">
        <div className="mt-4 h-screen bg-miru-gray-100 py-10 px-20">
          <div className="flex h-36 flex-row items-center bg-white p-5">
            <div className="w-fit border-r-2 border-miru-gray-200 pr-12">
              <GoogleIcon />
            </div>
            {/* <span className="w-2/5 px-4 text-sm font-normal leading-5 text-miru-dark-purple-1000">
              {isStripeConnected
                ? "Your stripe account is now connected and ready to accept online payments"
                : "Connect with your existing stripe account or create a new account"}
            </span> */}
            {/* {isStripeConnected ? (
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
          ) : ( */}
            <button onClick={connectCalendar}>
              <img className="pr-5" src={ConnectSVG} />
            </button>
            {/* )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
