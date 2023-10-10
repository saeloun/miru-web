import React, { useState } from "react";

import { getYear } from "date-fns";

import AutoSearch from "common/AutoSearch";
import CustomYearPicker from "common/CustomYearPicker";

const Header = () => {
  const [currentYear, setCurrentYear] = useState<number>(
    getYear(new Date()) + 1
  );

  return (
    <div className="m-4 flex items-center justify-between lg:mx-0">
      <span className="hidden text-3xl font-bold text-miru-dark-purple-1000 lg:inline">
        Leave Management
      </span>
      <AutoSearch
        SearchDataRow={() => null}
        searchAction={() => null}
        wrapperClassName="mr-2 lg:mr-0"
      />
      <CustomYearPicker
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        wrapperClassName="text-miru-han-purple-1000"
        yearClassName="text-miru-han-purple-1000"
      />
    </div>
  );
};

export default Header;
