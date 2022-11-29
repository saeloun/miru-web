import React from "react";

const CompanyInfo = ({ company, logo="" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;

  return (
    <div className="flex flex-col md:flex-row justify-between border-b-2 border-miru-gray-400 md:p-10 md:h-40">
      <div className="flex flex-col md:flex-row">
        <img src={company.logo ? company.logo : logo} className="md:m-0 m-auto md:mr-5" />
        <div className="mt-2 md:text-left text-center">
          <p className="font-bold md:text-3xl text-xl text-miru-dark-purple-1000">
            {company.name}
          </p>
          <p className="mt-1 font-normal text-base text-miru-dark-purple-1000">
            {phoneNumber ? phoneNumber : company.business_phone }
          </p>
        </div>
      </div>

      <div className="font-normal text-base md:text-right text-center text-miru-dark-purple-1000 md:w-72 overflow-y-auto">
        <p className="whitespace-pre"> {company.address.split(",").join(",\n")} </p>
        <p>{company.country}</p>
      </div>
    </div>
  );
};

export default CompanyInfo;
