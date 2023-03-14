import React from "react";

import { currencyFormat } from "helpers";
import { Avatar } from "StyledComponents";

import { RevenueByClients } from "../interface";

const MobileRow = ({ currency, report }) => {
  const {
    id,
    logo,
    name,
    outstandingAmount,
    overdueAmount,
    paidAmount,
    totalAmount,
  }: RevenueByClients = report;

  return (
    <div className="mt-2" key={id}>
      <div>
        <span className="flex items-center">
          <Avatar classNameImg="mr-2 lg:mr-6" url={logo} />
          <p className="whitespace-normal text-base font-normal text-miru-dark-purple-1000">
            {name}
          </p>
        </span>
      </div>
      <div className="mt-2.5 flex justify-between">
        <p className="text-xs font-medium text-miru-dark-purple-400">Overdue</p>
        <p className="text-sm font-medium text-miru-dark-purple-1000">
          {currencyFormat(currency, overdueAmount)}
        </p>
      </div>
      <div className="mt-2.5 flex justify-between">
        <p className="text-xs font-medium text-miru-dark-purple-400">
          Outstanding
        </p>
        <p className="text-sm font-medium text-miru-dark-purple-1000">
          {currencyFormat(currency, outstandingAmount)}
        </p>
      </div>
      <div className="mt-2.5 flex justify-between">
        <p className="text-xs font-medium text-miru-dark-purple-400">Paid</p>
        <p className="text-sm font-medium text-miru-dark-purple-1000">
          {currencyFormat(currency, paidAmount)}
        </p>
      </div>
      <div className="mt-2.5 mb-5 flex justify-between">
        <p className="text-xs font-bold text-miru-dark-purple-400">Total</p>
        <p className="text-sm font-bold text-miru-dark-purple-1000">
          {currencyFormat(currency, totalAmount)}
        </p>
      </div>
    </div>
  );
};

export default MobileRow;
