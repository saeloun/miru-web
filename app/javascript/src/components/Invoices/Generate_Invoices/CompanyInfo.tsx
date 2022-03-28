import * as React from "react";
const logo = require("../../../../images/saeloun.svg"); // eslint-disable-line

const CompanyInfo = () => (
  <div className="flex justify-between border-b-2 border-miru-gray-400 p-10 h-40">
    <div className="flex">
      <img src={logo} className="mr-5" />
      <div className="mt-2">
        <p className="font-bold text-3xl text-miru-dark-purple-1000">
            Saeloun Inc.
        </p>
        <p className="mt-1 font-normal text-base text-miru-dark-purple-1000">
            +1-234-454
        </p>
      </div>
    </div>

    <div className="font-normal text-base text-right text-miru-dark-purple-1000 w-36">
      <p className="">31R</p>
      <p>Providence Rd</p>
      <p>Westford MA,01886</p>
    </div>
  </div>
);

export default CompanyInfo;
