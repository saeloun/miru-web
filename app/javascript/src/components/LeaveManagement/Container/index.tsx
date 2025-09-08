import React, { useState } from "react";

import { useUserContext } from "context/UserContext";
import { minToHHMM } from "helpers";
import { X } from "phosphor-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

import LeaveBlock from "./LeaveBlock";
import Table from "./Table";

const Container = ({
  getLeaveBalanaceDateText,
  leaveBalance,
  timeoffEntries,
  totalTimeoffEntriesDuration,
  selectedLeaveType,
  setSelectedLeaveType,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { company } = useUserContext();

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      {leaveBalance && leaveBalance.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {getLeaveBalanaceDateText()}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {leaveBalance.map((leaveType, index) => (
              <LeaveBlock
                key={index}
                leaveType={leaveType}
                selectedLeaveType={selectedLeaveType}
                setSelectedLeaveType={setSelectedLeaveType}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calendar display removed */}

      {/* Leave Details Table */}
      {timeoffEntries && timeoffEntries.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-semibold">
                  Leave History
                </CardTitle>
                {selectedLeaveType && (
                  <div className="flex items-center gap-2 rounded-md bg-miru-han-purple-100 px-3 py-1.5 text-sm">
                    <span className="font-medium text-miru-han-purple-1000">
                      {selectedLeaveType.name}
                    </span>
                    <X
                      className="h-3.5 w-3.5 cursor-pointer text-miru-han-purple-600 hover:text-miru-han-purple-1000"
                      onClick={() => setSelectedLeaveType(null)}
                    />
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Total:{" "}
                <span className="font-semibold text-gray-900">
                  {minToHHMM(totalTimeoffEntriesDuration || 0)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table timeoffEntries={timeoffEntries} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Container;
