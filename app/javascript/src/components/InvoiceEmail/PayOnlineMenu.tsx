import React from "react";

const stripe = require("../../../../assets/images/StripeDropdown.svg"); // eslint-disable-line

const Discountmenu = ({ stripeUrl }) => (
  <div className="absolute mt-10 w-44 rounded-lg bg-white py-2 shadow">
    <ul className="list-none">
      <li className="flex cursor-pointer rounded bg-white py-2.5 px-4 hover:bg-miru-gray-100">
        <a className="flex" href={stripeUrl}>
          <img src={stripe} />
          <span className="pl-2 text-sm font-medium text-miru-han-purple-1000">
            Pay via Stripe
          </span>
        </a>
      </li>
    </ul>
  </div>
);

export default Discountmenu;
