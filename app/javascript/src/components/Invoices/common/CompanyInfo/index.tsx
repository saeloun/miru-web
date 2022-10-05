import React from "react";

const CompanyInfo = ({ company, logo="" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;

  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 p-10 h-40">
      <div className="flex">
        <img src={company.logo ? company.logo : logo} className="mr-5" />
        <div className="mt-2">
          <p className="font-bold text-3xl text-miru-dark-purple-1000">
            {company.name}
          </p>
          <p className="mt-1 font-normal text-base text-miru-dark-purple-1000">
            {phoneNumber ? phoneNumber : company.business_phone }
          </p>
        </div>
      </div>

      <div className="font-normal text-base text-right text-miru-dark-purple-1000 w-72">
        <p className="whitespace-pre"> {company.address.split(",").join(",\n")} </p>
        <p>{company.country}</p>
      </div>
    </div>
  );
};

export default CompanyInfo;
