import React from "react";

const CompanyInfo = ({ companyDetails }) => (
  <div className="flex justify-between border-b-2 border-miru-gray-400 p-10 h-40">
    <div className="flex">
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

    <div className="font-normal text-base text-right text-miru-dark-purple-1000 w-36">
      <p>{companyDetails.address}</p>
      <p>{companyDetails.country}</p>
    </div>
  </div>
);

export default CompanyInfo;
