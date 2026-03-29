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
          <p className="whitespace-normal text-base font-normal text-foreground">
            {name}
          </p>
        </span>
      </div>
      <div className="mt-2.5 flex justify-between">
        <p className="text-xs font-medium text-muted-foreground">Overdue</p>
        <p className="text-sm font-medium text-foreground">
          {currencyFormat(currency, overdueAmount)}
        </p>
      </div>
      <div className="mt-2.5 flex justify-between">
        <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
        <p className="text-sm font-medium text-foreground">
          {currencyFormat(currency, outstandingAmount)}
        </p>
      </div>
      <div className="mt-2.5 flex justify-between">
        <p className="text-xs font-medium text-muted-foreground">Paid</p>
        <p className="text-sm font-medium text-foreground">
          {currencyFormat(currency, paidAmount)}
        </p>
      </div>
      <div className="mt-2.5 mb-5 flex justify-between">
        <p className="text-xs font-bold text-muted-foreground">Total</p>
        <p className="text-sm font-bold text-foreground">
          {currencyFormat(currency, totalAmount)}
        </p>
      </div>
    </div>
  );
};

export default MobileRow;
