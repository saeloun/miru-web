/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import Header from "./Header";
const Connect = require("../../../../assets/images/Connect.svg");
const Stripe_Logo = require("../../../../assets/images/stripe_logo.svg");

const payment_settings = () => (
  <React.Fragment>
    <Header />
    <div className="my-5">
      <span className="mr-10 text-sm text-miru-han-purple-1000 hover:text-miru-han-purple-600 tracking-widest leading-7 py-1 cursor-pointer">
        PROFILE SETTINGS
      </span>
      <span className="mr-10 text-sm text-miru-han-purple-1000 hover:text-miru-han-purple-600 tracking-widest leading-7 py-1 cursor-pointer">
        ORGANIZATION SETTINGS
      </span>
      <span className="mr-10 underline font-extrabold text-sm text-miru-han-purple-1000 hover:text-miru-han-purple-600 tracking-widest leading-7 py-1 cursor-pointer">
        PAYMENT SETTINGS
      </span>
    </div>
    <div className="mt-5 mb-10 p-10 bg-miru-gray-100 h-screen">
      <div className="h-36 p-5 bg-white flex justify-between items-center">
        <div className="pr-12 border-r-2 border-miru-gray-200 w-fit">
          <img src={Stripe_Logo} />
        </div>
        <span className="font-normal text-sm text-miru-dark-purple-1000 leading-5">
          Connect with your existing stripe account or create a new account
        </span>
        <button>
          <img src={Connect} className="pr-5" />
        </button>
      </div>
    </div>
  </React.Fragment>
);

export default payment_settings;
