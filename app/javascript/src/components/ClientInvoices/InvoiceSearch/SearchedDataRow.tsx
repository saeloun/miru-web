import React from "react";

import { currencyFormat } from "helpers";
import { useNavigate } from "react-router-dom";

import getStatusCssClass from "utils/getBadgeStatus";

const SearchDataRow = ({ invoice }) => {
  const navigate = useNavigate();

  const handleClick = invoice => {
    navigate(`/invoices/${invoice.externalViewKey}`);
  };

  const { client, invoiceNumber, currency, amount, issueDate, status } =
    invoice;

  return (
    <div
      className="group flex cursor-pointer items-center py-2 last:border-b-0 hover:bg-miru-gray-100"
      onClick={() => handleClick(invoice)}
    >
      <div className="w-5/12 p-0 font-medium tracking-wider">
        <div className="pb-1 text-sm font-medium capitalize text-miru-dark-purple-1000">
          {client.name}
        </div>
        <div className="text-sm font-normal text-miru-dark-purple-400">
          {invoiceNumber}
        </div>
      </div>
      <div className="w-4/12 px-2/100 font-bold tracking-wider">
        {currencyFormat(currency, amount)}
        <div className="text-sm font-normal text-miru-dark-purple-400">
          {issueDate}
        </div>
      </div>
      <div className="w-3/12 pl-2/100 text-right font-medium">
        <span className={`${getStatusCssClass(status)} uppercase tracking-2`}>
          {status}
        </span>
      </div>
    </div>
  );
};

export default SearchDataRow;
