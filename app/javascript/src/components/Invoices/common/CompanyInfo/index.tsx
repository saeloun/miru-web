import React from "react";

const CompanyInfo = ({ company, logo = "" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;

  return (
    <div className="flex h-40 justify-between border-b-2 border-miru-gray-400 p-10">
      <div className="flex">
        <img className="mr-5" src={company.logo ? company.logo : logo} />
        <div className="mt-2">
          <p className="text-3xl font-bold text-miru-dark-purple-1000">
            {company.name}
          </p>
          <p className="mt-1 text-base font-normal text-miru-dark-purple-1000">
            {phoneNumber || company.business_phone}
          </p>
        </div>
      </div>
      <div className="w-72 overflow-y-auto text-right text-base font-normal text-miru-dark-purple-1000">
        <p className="whitespace-pre">
          {" "}
          {company.address.split(",").join(",\n")}{" "}
        </p>
        <p>{company.country}</p>
      </div>
    </div>
  );
};

export default CompanyInfo;
