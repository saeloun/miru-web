import React from "react";

import Header from "../Header";

const TotalHoursReport = () => (
  <div>
    <Header
      showNavFilters={true}
      setFilterVisibilty={true}
      isFilterVisible={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
      resetFilter={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
      handleDownload={() => { }} // eslint-disable-line  @typescript-eslint/no-empty-function
      type={"Total Hours Logged"}
    />
    <div>
      {/** Container will be listed here */}
    </div>
  </div>
);

export default TotalHoursReport;
