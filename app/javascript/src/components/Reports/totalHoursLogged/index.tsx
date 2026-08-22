import React from "react";

import Header from "../Header";
import MobileView from "./MobileView";

const TotalHoursReport = () => (
  <div className="w-full">
    <Header
      setIsFilterVisible={() => {}}
      showExportButon
      showFilterIcon={false}
      showNavFilters
      handleDownload={() => {}}
      isFilterVisible={() => {}}
      resetFilter={() => {}}
      revenueFilterCounter={() => {}}
      type="Total Hours Logged"
    />
    <MobileView />
  </div>
);

export default TotalHoursReport;
