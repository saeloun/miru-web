import React from "react";

import { Avatar } from "StyledComponents";
import { i18n } from "../../../../i18n";

const CompanyInfo = ({ company, logo = "" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;
  const companyEin = company?.ein;
  const { address_line_1, address_line_2, city, state, country, pin } =
    company.address;

  return (
    <div className="flex h-24 items-center justify-between border-b border-border p-4 pb-2 lg:h-40 lg:p-10">
      <div className="flex h-full items-center">
        <Avatar
          classNameImg="mr-5"
          classNameInitials="lg:text-3xl text-lg font-semibold capitalize text-white"
          classNameInitialsWrapper="mr-5 bg-secondary "
          initialsLetterCount={1}
          name={company.name}
          size="h-10 w-10 lg:h-20 lg:w-20"
          url={company.logo || logo}
        />
        <div className="text-center md:text-left lg:mt-2">
          <p className="text-base font-semibold leading-7 tracking-tight text-foreground sm:text-xl lg:text-2xl">
            {company.name}
          </p>
          <p className="mt-1 text-left text-xs font-normal text-foreground lg:text-base">
            {phoneNumber || company.business_phone}
          </p>
        </div>
      </div>
      <div className="h-full overflow-y-auto text-right text-xs font-normal text-foreground lg:w-72 lg:text-base">
        <p className="whitespace-pre">
          {`${address_line_1},\n ${address_line_2},\n ${city}, ${state}, ${country},\n ${pin}`}
        </p>
        {companyEin && <p>{i18n.t("invoices.ein", { value: companyEin })}</p>}
      </div>
    </div>
  );
};

export default CompanyInfo;
