import React from "react";

import { minToHHMM } from "helpers";
import { XIcon } from "miruIcons";

import { Divider } from "common/Divider";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const Container = ({
  getLeaveBalanaceDateText,
  leaveBalance,
  timeoffEntries,
  totalTimeoffEntriesDuration,
  selectedLeaveType,
  setSelectedLeaveType,
}) => (
  <div className="mx-4 my-6 h-full lg:mx-0">
    <p className="text-base font-normal text-miru-dark-purple-1000 lg:text-2xl">
      {getLeaveBalanaceDateText()}
    </p>
    <div className="mt-6 grid w-full gap-4 lg:grid-cols-3">
      {leaveBalance.map((leaveType, index) => (
        <LeaveBlock
          key={index}
          leaveType={leaveType}
          selectedLeaveType={selectedLeaveType}
          setSelectedLeaveType={setSelectedLeaveType}
        />
      ))}
    </div>
    <div className="mt-10">
      <div className="flex items-center justify-between py-3 lg:py-5">
        <div className="flex items-center">
          <span className="mr-4 text-lg font-bold text-miru-dark-purple-1000 lg:text-xl">
            Leave Details
          </span>
          {selectedLeaveType && (
            <div className="flex items-center justify-center rounded-xl bg-miru-gray-400 px-3 py-1 lg:mx-2 lg:my-0">
              <span className="tracking-wide text-base font-normal capitalize text-miru-dark-purple-1000">
                {selectedLeaveType.name}
              </span>
              <XIcon
                className="ml-2 cursor-pointer"
                size={14}
                onClick={() => setSelectedLeaveType(null)}
              />
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
          Total :{" "}
          <span className="font-bold">
            {minToHHMM(totalTimeoffEntriesDuration)}
          </span>
        </p>
      </div>
      <Divider />
      <Table timeoffEntries={timeoffEntries} />
    </div>
  </div>
);

export default Container;
