import React from "react";

const CompanyInfo = ({ companyDetails }) => (
  <div className="flex justify-between border-b-2 border-miru-gray-400 p-10 h-fit">
    <div className="flex h-30">
      <img src={companyDetails.logo} className="mr-5" />
      <div className="mt-2">
        <p className="font-bold text-3xl text-miru-dark-purple-1000">
          {companyDetails.name}
        </p>
        <p className="mt-1 font-normal text-base text-miru-dark-purple-1000">
          {companyDetails.phone_number}
        </p>
      </div>
    </div>

    <div className="font-normal text-base text-right text-miru-dark-purple-1000 w-1/2">
      <p className="whitespace-pre"> {companyDetails.address.split(",").join(",\n")} </p>
      <p>{companyDetails.country}</p>
    </div>
  </div>
);

export default CompanyInfo;
