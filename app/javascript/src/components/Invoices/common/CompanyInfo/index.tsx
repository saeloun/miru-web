import React from "react";

const CompanyInfo = ({ company, logo = "" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;

  return (
    <div className="flex flex-col justify-between border-b-2 border-miru-gray-400 md:h-40 md:flex-row md:p-10">
      <div className="flex flex-col md:flex-row">
        <img
          className="m-auto md:m-0 md:mr-5"
          src={company.logo ? company.logo : logo}
        />
        <div className="mt-2 text-center md:text-left">
          <p className="text-xl font-bold text-miru-dark-purple-1000 md:text-3xl">
            {company.name}
          </p>
          <p className="mt-1 text-base font-normal text-miru-dark-purple-1000">
            {phoneNumber || company.business_phone}
          </p>
        </div>
      </div>
      <div className="overflow-y-auto text-center text-base font-normal text-miru-dark-purple-1000 md:w-72 md:text-right">
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
