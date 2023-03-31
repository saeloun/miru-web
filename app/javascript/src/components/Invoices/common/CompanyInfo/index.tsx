import React from "react";

const CompanyInfo = ({ company, logo = "" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;

  return (
    <div className="flex h-24 items-center justify-between border-b border-miru-gray-400 p-4 pb-2 lg:h-40 lg:p-10">
      <div className="flex h-full items-center">
        <img
          className="mr-2 h-10 w-10 rounded-full lg:mr-5 lg:h-20 lg:w-20"
          src={company.logo ? company.logo : logo}
        />
        <div className="text-center md:text-left lg:mt-2">
          <p className="text-xl font-bold leading-7 text-miru-dark-purple-1000 lg:text-3xl">
            {company.name}
          </p>
          <p className="mt-1 text-left text-xs font-normal text-miru-dark-purple-1000 lg:text-base">
            {phoneNumber || company.business_phone}
          </p>
        </div>
      </div>
      <div className="overflow-y-auto text-right text-right text-xs font-normal text-miru-dark-purple-1000 lg:h-auto lg:w-72 lg:text-base">
        <p className="whitespace-pre">
          {company.address.split(",").join(",\n")}
        </p>
        <p>{company.country}</p>
      </div>
    </div>
  );
};

export default CompanyInfo;
