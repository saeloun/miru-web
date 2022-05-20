import React from "react";
const stripe = require('../../../../assets/images/StripeDropdown.svg'); // eslint-disable-line
const paypal = require('../../../../assets/images/PaypalDropdown.svg'); // eslint-disable-line

const Discountmenu = ( ) => (
  <div className="bg-white rounded-lg w-44 py-2 mt-10 absolute shadow">
    <ul className="list-none">
      <li
        className="flex py-2.5 px-4 cursor-pointer bg-white hover:bg-miru-gray-100 rounded"
      >
        <img src={stripe} />
        <span className="pl-2 font-medium text-sm text-miru-han-purple-1000">Pay via Stripe</span>
      </li>
      <li
        className="flex py-2.5 px-4 cursor-pointer bg-white hover:bg-miru-gray-100 rounded"
      >
        <img src={paypal} />
        <span className="pl-2 font-medium text-sm text-miru-han-purple-1000">Pay via PayPal</span>
      </li>
    </ul>
  </div>
);

export default Discountmenu;
