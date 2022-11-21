import React from "react";

const StaticPage = () => (
  <div className="bg-miru-gray-100 px-10 mt-4 h-full">
    <div className="flex py-10 border-b border-b-miru-gray-400">
      <div className="w-1/5 pr-4">
        <span className="text-miru-dark-purple-1000 font-medium text-sm">
          Earnings
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="team__section-value-label">Earning Type</span>
            <p className="team__section-value">Monthly Salary</p>
          </div>
          <div className="w-6/12">
            <span className="team__section-value-label">Amount</span>
            <p className="team__section-value">₹1,25,000</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-10 border-b border-b-miru-gray-400">
      <div className="w-1/5 pr-4">
        <span className="text-miru-dark-purple-1000 font-medium text-sm">
          Deductions
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="team__section-value-label">Deduction Type</span>
            <p className="team__section-value">TDS</p>
          </div>
          <div className="w-6/12">
            <span className="team__section-value-label">Amount</span>
            <p className="team__section-value">₹12,500</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-10">
      <div className="w-1/5 pr-4">
        <span className="text-miru-dark-purple-1000 font-medium text-sm">
          Total
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12"></div>
          <div className="w-6/12">
            <p className="team__section-value">₹1,12,500</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
