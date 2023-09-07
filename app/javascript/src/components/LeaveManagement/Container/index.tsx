import React from "react";

import { Divider } from "common/Divider";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const Container = ({ leaveTypes }) => {
  const leaveDetails = [
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
    { date: "1/1/10", status: "approved", description: "annual", hours: "123" },
  ];

  return (
    <div className="mx-4 my-6 h-full lg:mx-0">
      <span className="text-base font-normal text-miru-dark-purple-1000 lg:text-2xl">
        Leave Balance Until 31st Dec 2023
      </span>
      <div className="mt-6 grid w-full gap-4 lg:grid-cols-3">
        {leaveTypes.map((leave, index) => (
          <LeaveBlock key={index} leave={leave} />
        ))}
      </div>
      <div className="mt-10">
        <div className="flex items-center justify-between py-3 lg:py-5">
          <span className="text-lg font-bold text-miru-dark-purple-1000 lg:text-xl">
            Leave Details
          </span>
          <span className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
            Total : <span className="font-bold">+144:00</span>
          </span>
        </div>
        <Divider />
        <Table leaveDetails={leaveDetails} />
      </div>
    </div>
  );
};

export default Container;
