/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import Header from "./Header";
import SideNav from "./SideNav";
const Connect = require("../../../../assets/images/Connect.svg");
const Connect_Paypal = require("../../../../assets/images/ConnectPaypal.svg");
const Paypal_Logo = require("../../../../assets/images/PaypalLogo.svg");
const Stripe_Logo = require("../../../../assets/images/stripe_logo.svg");

const payment_settings = () => (
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
          <div className="h-36 p-5 bg-white flex justify-between items-center">
            <div className="pr-12 border-r-2 border-miru-gray-200 w-fit">
              <img src={Stripe_Logo} />
            </div>
            <span className="px-4 font-normal text-sm text-miru-dark-purple-1000 leading-5 w-2/5">
              Connect with your existing stripe account or create a new account
            </span>
            <button>
              <img src={Connect} className="pr-5" />
            </button>
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
);

export default payment_settings;
