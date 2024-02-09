import React from "react";

import { minToHHMM } from "helpers";
import { Button } from "StyledComponents";

import { Divider } from "common/Divider";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const Container = ({
  currentYear,
  leaveBalance,
  timeoffEntries,
  totalTimeoffEntriesDuration,
  selectedLeaveType,
  setSelectedLeaveType,
}) => (
  <div className="mx-4 my-6 h-full lg:mx-0">
    <div className="flex justify-between">
      <span className="text-base font-normal text-miru-dark-purple-1000 lg:text-2xl">
        Leave Balance Until 31st Dec {currentYear}
      </span>
      <Button style="ternary" onClick={() => setSelectedLeaveType(null)}>
        {selectedLeaveType && "View all leaves"}
      </Button>
    </div>
    <div className="mt-6 grid w-full gap-4 lg:grid-cols-3">
      {leaveBalance.map((leaveType, index) => (
        <LeaveBlock
          key={index}
          leaveType={leaveType}
          setSelectedLeaveType={setSelectedLeaveType}
        />
      ))}
    </div>
    <div className="mt-10">
      <div className="flex items-center justify-between py-3 lg:py-5">
        <span className="text-lg font-bold text-miru-dark-purple-1000 lg:text-xl">
          {`Leave Details ${
            selectedLeaveType ? `(${selectedLeaveType.name})` : ""
          }`}
        </span>
        <span className="text-sm font-medium text-miru-dark-purple-1000 lg:text-base">
          Total :{" "}
          <span className="font-bold">
            {minToHHMM(totalTimeoffEntriesDuration)}
          </span>
        </span>
      </div>
      <Divider />
      <Table timeoffEntries={timeoffEntries} />
    </div>
  </div>
);

export default Container;
