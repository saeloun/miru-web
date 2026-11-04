import React from "react";

import { Avatar } from "StyledComponents";
import { i18n } from "../../../../i18n";

const CompanyInfo = ({ company, logo = "" }) => {
  const phoneNumber = company?.phoneNumber || company?.phone_number;
  const companyEin = company?.ein;
  const { address_line_1, address_line_2, city, state, country, pin } =
    company.address ?? {};

  return (
    <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8 lg:p-10">
      <div className="flex min-w-0 items-center lg:flex-1">
        <Avatar
          classNameImg="mr-5"
          classNameInitials="lg:text-3xl text-lg font-semibold capitalize text-white"
          classNameInitialsWrapper="mr-5 bg-secondary "
          initialsLetterCount={1}
          name={company.name}
          size="h-10 w-10 lg:h-20 lg:w-20"
          url={company.logo || logo}
        />
        <div className="min-w-0 flex-1 text-left lg:mt-2">
          <p className="break-words text-base font-semibold leading-7 tracking-tight text-foreground sm:text-xl lg:text-2xl">
            {company.name}
          </p>
          <p className="mt-1 text-left text-xs font-normal text-foreground lg:text-base">
            {phoneNumber || company.business_phone}
          </p>
        </div>
      </div>
      <div className="w-full min-w-0 break-words text-left text-xs font-normal text-foreground lg:w-72 lg:shrink-0 lg:text-right lg:text-base">
        <p className="whitespace-pre-line">
          {[
            address_line_1,
            address_line_2,
            [city, state, country].filter(Boolean).join(", "),
            pin,
          ]
            .filter(Boolean)
            .join("\n")}
        </p>
        {companyEin && <p>{i18n.t("invoices.ein", { value: companyEin })}</p>}
      </div>
    </div>
  );
};

export default CompanyInfo;
