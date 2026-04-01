import React from "react";

import Header from "../Header";

const TotalHoursReport = () => (
  <div>
    <Header
      setIsFilterVisible
      showExportButon
      showNavFilters
      handleDownload={() => {}}
      isFilterVisible={() => {}}
      resetFilter={() => {}}
      revenueFilterCounter={() => {}}
      type="Total Hours Logged"
    />
    <div />
  </div>
);

export default TotalHoursReport;
