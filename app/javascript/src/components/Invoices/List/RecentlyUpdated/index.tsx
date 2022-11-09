import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge } from "StyledComponents";

import getStatusCssClass from "utils/getBadgeStatus";

const RecentlyUpdated = ({ invoice }) => {
  const navigate = useNavigate();

  const formattedAmount = (amount, baseCurrency) =>
    currencyFormat({ baseCurrency: baseCurrency, amount });

  return (
    <div
      onClick={() => navigate(`/invoices/${invoice.id}`)}
      className="p-4 mx-2 w-40 h-auto flex flex-col justify-between border-miru-gray-200 border-2 rounded-xl text-center cursor-pointer"
    >
      <h3 className="text-xs text-center font-normal text-miru-dark-purple-400 mr-0.5">
        {invoice.invoiceNumber}
      </h3>
      <div className="flex justify-center md:my-3 my-1">
        <Avatar />
      </div>
      <p className="mt-1 mb-2.5 font-semibold md:text-base text-sm text-center capitalize text-miru-dark-purple-1000 leading-5 h-11 flex justify-center items-center">
        <p className="truncateOverflowText">{invoice.client.name}</p>
      </p>
      <h1 className="mt-2.5 mb-1 md:text-xl text-base font-bold text-miru-dark-purple-1000 truncate">
        {" "}
        {formattedAmount(invoice.amount, invoice.company.baseCurrency)}{" "}
      </h1>
      <div>
        <Badge
          text={invoice.status}
          className={`${getStatusCssClass(invoice.status)} uppercase mt-2`}
        />
      </div>
    </div>
  );
};

export default RecentlyUpdated;
