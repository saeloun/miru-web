import React from "react";

import CustomYearPicker from "common/CustomYearPicker";
import SearchTimeEntries from "common/SearchTimeEntries";

const Header = ({
  currentYear,
  setCurrentYear,
  isAdminUser,
  employeeList,
  selectedEmployeeId,
  setSelectedEmployeeId,
}) => (
  <div className="m-4 flex items-center justify-between lg:mx-0">
    <span className="hidden text-3xl font-bold text-miru-dark-purple-1000 lg:inline">
      Leave Management
    </span>
    <CustomYearPicker
      currentYear={currentYear}
      setCurrentYear={setCurrentYear}
      wrapperClassName="text-miru-han-purple-1000"
      yearClassName="text-miru-han-purple-1000"
    />
    {isAdminUser && selectedEmployeeId && (
      <SearchTimeEntries
        employeeList={employeeList}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
      />
    )}
  </div>
);

export default Header;
