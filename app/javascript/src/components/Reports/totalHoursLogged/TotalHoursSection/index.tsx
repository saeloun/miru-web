import React from "react";
import TotalHeader from "common/TotalHeader";
import { calculateTotalHours } from "helpers/totalHours";

const TotalHoursSection = (reports) => {
  const { totalBilledHours, totalNonbillableHours, totalUnbilledHours } = calculateTotalHours(reports.reports);

  return (
    <TotalHeader
      firstTitle={"TOTAL BILLED HOURS"}
      firstAmount={totalBilledHours}
      secondTitle={"TOTAL UNBILLED HOURS"}
      secondAmount={totalUnbilledHours}
      thirdTitle={"TOTAL NON BILLABLE HOURS"}
      thirdAmount={totalNonbillableHours}
    />
  );
};

export default TotalHoursSection;
