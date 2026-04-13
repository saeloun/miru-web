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
import { i18n } from "../../../i18n";

// Default color for custom leaves
const CUSTOM_LEAVE_COLOR = { value: "#9B59B6", label: "custom" };
const CUSTOM_LEAVE_ICON = { icon: null, value: "custom" };

const LeaveBlock = ({ leaveType, selectedLeaveType, setSelectedLeaveType }) => {
  const { icon, color, name, netDuration, type, category, label } = leaveType;

  const translatedName =
    category === "national"
      ? i18n.t("leaveManagement.publicHolidays")
      : category === "optional"
      ? i18n.t("leaveManagement.optionalHolidays")
      : name;

  const translatedLabel =
    typeof label === "string"
      ? label
          .replace(/\bout of\b/gi, i18n.t("leaveManagement.outOf"))
          .replace(/\bthis quarter\b/gi, i18n.t("leaveManagement.thisQuarter"))
          .replace(/\bthis year\b/gi, i18n.t("leaveManagement.thisYear"))
          .replace(/\bthis month\b/gi, i18n.t("leaveManagement.thisMonth"))
          .replace(/\bthis week\b/gi, i18n.t("leaveManagement.thisWeek"))
      : label;

  const getLeaveIcon = () => {
    if (type === "custom_leave") {
      return generateLeaveIcon("custom") || CUSTOM_LEAVE_ICON;
    }

    return type === "leave"
      ? generateLeaveIcon(icon)
      : generateHolidayIcon(icon);
  };

  const getLeaveColor = () => {
    if (type === "custom_leave" || type === "leave") {
      return generateLeaveColor(color) || CUSTOM_LEAVE_COLOR;
    }

    return generateHolidayColor(color) || CUSTOM_LEAVE_COLOR;
  };

  const leaveIcon = getLeaveIcon();
  const leaveColor = getLeaveColor();

  const formattedDuration =
    category == "national" || category == "optional"
      ? translatedLabel
      : netDuration < 0
      ? `-${minToHHMM(-netDuration)} h (-${translatedLabel})`
      : `${minToHHMM(netDuration)} h (${translatedLabel})`;

  const isSelected = selectedLeaveType?.name === name;

  const getSelectedText = () => {
    if (!isSelected) return translatedName;

    if (category === "national" || category === "optional") {
      return i18n.t("leaveManagement.leaveTypeUtilized", {
        name: translatedName,
      });
    }

    return i18n.t("leaveManagement.leaveTypeAvailable", {
      name: translatedName,
    });
  };

  const displayName = getSelectedText();

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border",
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
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
              <h3 className="font-medium text-foreground">{displayName}</h3>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {formattedDuration}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBlock;
