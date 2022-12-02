import React, { useState } from "react";

import Select from "react-select";

const FilterSelect = ({ option, placeholder }) => {
  const [selectedOption, setSelectedOption] = useState<any>();

  return (
    <Select
      isSearchable
      className="w-40 rounded bg-miru-gray-100 text-sm font-medium"
      defaultValue={selectedOption}
      options={option}
      placeholder={placeholder}
      components={{
        IndicatorSeparator: () => null,
      }}
      onChange={e => {
        setSelectedOption(e);
      }}
    />
  );
};

export default FilterSelect;
