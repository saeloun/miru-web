import React from "react";

import { currencyFormat } from "helpers";
import { EarningsIconSVG, DeductionIconSVG, CoinsIcon } from "miruIcons";

const StaticPage = ({ compensationDetails, currency }) => {
  const { earnings, deductions, total } = compensationDetails;

  return (
    <div className="mt-4 h-full px-4 lg:bg-muted lg:px-10">
      <div className="border-b border-b-border py-10 lg:flex">
        <div className="flex py-5 lg:w-1/5 lg:py-0 lg:pr-4">
          <img className="mr-4 mt-1 h-4 w-4" src={EarningsIconSVG} />
          <span className="flex flex-wrap text-sm font-medium text-foreground">
            Earnings
          </span>
        </div>
        <div className="w-full lg:w-4/5">
          {earnings ? (
            earnings.map((earning, index) => (
              <div className="flex" key={index}>
                <div className="w-6/12">
                  <span className="text-xs text-foreground">Earning Type</span>
                  <p className="text-base font-medium text-foreground">
                    {earning.type || "-"}
                  </p>
                </div>
                <div className="w-6/12">
                  <span className="text-xs text-foreground">Amount</span>
                  <p className="text-base font-medium text-foreground">
                    {currencyFormat(currency, earning.amount) || "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs">No earning(s) found</div>
          )}
        </div>
      </div>
      <div className="border-b border-b-border py-10 lg:flex">
        <div className="flex py-5 lg:w-1/5 lg:py-0 lg:pr-4">
          <img className="mr-4 mt-1 h-4 w-4" src={DeductionIconSVG} />
          <span className="flex flex-wrap text-sm font-medium text-foreground">
            Deductions
          </span>
        </div>
        <div className="flex w-full flex-col items-center justify-center lg:w-4/5">
          {deductions ? (
            deductions.map((deduction, index) => (
              <div className="mb-4 flex w-full" key={index}>
                <div className="w-6/12">
                  <span className="text-xs text-foreground">
                    Deduction Type
                  </span>
                  <p className="text-base font-medium text-foreground">
                    {deduction.type}
                  </p>
                </div>
                <div className="w-6/12">
                  <span className="text-xs text-foreground">Amount</span>
                  <p className="text-base font-medium text-foreground">
                    {currencyFormat(currency, deduction.amount) || "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs">No deduction(s) found</div>
          )}
        </div>
      </div>
      <div className="flex py-10">
        <div className="flex w-1/2 py-5 lg:w-1/5 lg:py-0">
          <CoinsIcon
            className="mr-4 mt-1 text-foreground"
            size={16}
            weight="bold"
          />
          <span className="flex flex-wrap text-sm font-medium text-foreground">
            Total
          </span>
        </div>
        <div className="flex w-1/2 flex-col justify-center lg:w-full lg:items-end">
          <span className="w-full text-xl font-medium text-foreground lg:w-1/2 lg:text-2xl">
            {currencyFormat(currency, total.amount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StaticPage;
