import React from "react";

const LeaveBlock = ({ leave }) => (
  <div
    className="flex w-full justify-start rounded-lg p-2 text-white lg:flex-col lg:p-6"
    style={{ background: leave.color }}
  >
    <div> {leave.icon} </div>
    <div className="mt-4 flex flex-col">
      <span className="text-xs font-semibold lg:text-sm">
        {leave.leaveType}
      </span>
      <span className="mt-2 text-base font-semibold lg:text-2xl">
        {leave.leaveHours}
      </span>
    </div>
  </div>
);

export default LeaveBlock;
