import React from "react";
import { Card, CardContent } from "../../ui/card";
import { cn } from "../../../lib/utils";

import {
  generateLeaveIcon,
  generateLeaveColor,
  generateHolidayIcon,
  generateHolidayColor,
} from "components/Profile/Organization/Leaves/utils";
import { minToHHMM } from "helpers";

const LeaveBlock = ({ leaveType, selectedLeaveType, setSelectedLeaveType }) => {
  const { icon, color, name, netDuration, type, category, label } = leaveType;

  const leaveIcon =
    type == "leave" ? generateLeaveIcon(icon) : generateHolidayIcon(icon);

  const leaveColor =
    type == "leave" ? generateLeaveColor(color) : generateHolidayColor(color);

  const formattedDuration =
    category == "national" || category == "optional"
      ? label
      : netDuration < 0
      ? `-${minToHHMM(-netDuration)} h (-${label})`
      : `${minToHHMM(netDuration)} h (${label})`;

  const isSelected = selectedLeaveType?.name === name;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border",
        isSelected
          ? "border-miru-han-purple-400 bg-miru-han-purple-100/30"
          : "border-gray-200 bg-white"
      )}
      onClick={() => setSelectedLeaveType(leaveType)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${leaveColor.value}15`,
                  color: leaveColor.value,
                }}
              >
                {leaveIcon?.icon}
              </div>
              <h3 className="font-medium text-gray-900">{name}</h3>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formattedDuration}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBlock;
