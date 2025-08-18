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
  <div className="mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl font-bold text-gray-900">
        Leaves & Holidays
      </h1>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <CustomYearPicker
          nextYearButtonDisabled
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          wrapperClassName="text-gray-700"
          yearClassName="text-gray-900 font-semibold"
        />
        {isAdminUser && selectedEmployeeId && (
          <SearchTimeEntries
            employeeList={employeeList}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
          />
        )}
      </div>
    </div>
  </div>
);

export default Header;
