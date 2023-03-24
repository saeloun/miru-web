import React from "react";

import Header from "../Header";

const TotalHoursReport = () => (
  <div>
    <Header
      setIsFilterVisible
      showExportButon
      showNavFilters
      handleDownload={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
      isFilterVisible={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
      resetFilter={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
      revenueFilterCounter={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
      type="Total Hours Logged"
    />
    <div>{/** Container will be listed here */}</div>
  </div>
);

export default TotalHoursReport;
